'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');
const couponRepository = require('../repositories/coupon.repository');
const notificationRepository = require('../repositories/notification.repository');
const settingService = require('./setting.service');
const couponService = require('./coupon.service');
const mailService = require('./mail.service');
const { Product, Payment, Inventory, sequelize } = require('../models');
const { generateOrderNumber } = require('../utils/identifiers');
const {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  INVENTORY_REASON,
  NOTIFICATION_TYPE,
  ROLES,
} = require('../constants');

const round = (value) => Math.round(Number.parseFloat(value || 0) * 100) / 100;

/**
 * Prices are read from the database, never from the request body: a client that
 * posts its own totals can only influence *what* is bought, not the amount
 * charged for it.
 */
const priceCart = async (items) => {
  const productIds = [...new Set(items.map((item) => String(item.productId)))];
  const products = await productRepository.findByIds(productIds);

  const byId = new Map(products.map((product) => [String(product.id), product]));
  const lines = [];
  let subtotal = 0;

  for (const item of items) {
    const product = byId.get(String(item.productId));

    if (!product || !product.isActive) {
      throw ApiError.badRequest(`A product in your cart is no longer available`, [
        { field: 'items', message: `Product ${item.productId} is unavailable` },
      ]);
    }

    if (product.stock < item.quantity) {
      throw ApiError.conflict(
        `Only ${product.stock} unit(s) of "${product.name}" are left in stock`,
        [{ field: 'items', message: `${product.name}: ${product.stock} available` }]
      );
    }

    const unitPrice = round(product.effectivePrice);
    const lineTotal = round(unitPrice * item.quantity);
    subtotal = round(subtotal + lineTotal);

    lines.push({
      product,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      productSlug: product.slug,
      productImage: product.images?.[0]?.url || null,
      weight: product.weight,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  if (lines.length === 0) throw ApiError.badRequest('Your cart is empty');

  return { lines, subtotal };
};

/**
 * Server-side quote for the checkout screen: the client renders this instead of
 * computing its own totals, so the number shown always matches what is charged.
 */
const quote = async ({ items, couponCode }, userId = null) => {
  const { lines, subtotal } = await priceCart(items);
  const shippingConfig = await settingService.getShippingConfig();
  const shippingTotal = settingService.calculateShipping(subtotal, shippingConfig);

  let discountTotal = 0;
  let coupon = null;

  if (couponCode) {
    const evaluated = await couponService.evaluate(couponCode, subtotal, userId);
    coupon = evaluated.coupon;
    discountTotal = evaluated.discount;
  }

  const grandTotal = round(Math.max(0, subtotal - discountTotal) + shippingTotal);

  return {
    items: lines.map(({ product, ...line }) => line),
    subtotal,
    discountTotal,
    shippingTotal,
    grandTotal,
    freeShippingThreshold: shippingConfig.freeThreshold,
    coupon: coupon ? { id: coupon.id, code: coupon.code, description: coupon.description } : null,
  };
};

const buildUniqueOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderNumber();
    // eslint-disable-next-line no-await-in-loop
    if ((await orderRepository.countOrderNumber(candidate)) === 0) return candidate;
  }
  throw ApiError.internal('Could not allocate an order number, please try again');
};

/**
 * Places an order.
 *
 * Everything that must succeed together — the order, its lines, the payment
 * row, the stock decrements and the ledger entries — runs in one transaction.
 * Stock is taken with a conditional UPDATE so two shoppers cannot both claim
 * the last unit.
 */
const create = async (payload, user = null) => {
  const { lines, subtotal } = await priceCart(payload.items);

  const shippingConfig = await settingService.getShippingConfig();
  const shippingTotal = settingService.calculateShipping(subtotal, shippingConfig);

  let discountTotal = 0;
  let coupon = null;

  if (payload.couponCode) {
    const evaluated = await couponService.evaluate(payload.couponCode, subtotal, user?.id || null);
    coupon = evaluated.coupon;
    discountTotal = evaluated.discount;
  }

  if (payload.paymentMethod === PAYMENT_METHOD.COD) {
    const codEnabled = await settingService.getBoolean('cod_enabled', true);
    if (!codEnabled) throw ApiError.badRequest('Cash on delivery is currently unavailable');
  }

  const grandTotal = round(Math.max(0, subtotal - discountTotal) + shippingTotal);
  const orderNumber = await buildUniqueOrderNumber();
  const billingAddress = payload.billingAddress || payload.shippingAddress;

  const order = await sequelize.transaction(async (transaction) => {
    const created = await orderRepository.create(
      {
        orderNumber,
        userId: user?.id || null,
        status: ORDER_STATUS.PENDING,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        customerPhone: payload.customerPhone,
        shippingAddress: payload.shippingAddress,
        billingAddress,
        subtotal,
        discountTotal,
        shippingTotal,
        grandTotal,
        couponId: coupon?.id || null,
        couponCode: coupon?.code || null,
        customerNote: payload.customerNote || null,
        placedAt: new Date(),
      },
      { transaction }
    );

    await orderRepository.bulkCreateItems(
      lines.map((line) => ({
        orderId: created.id,
        productId: line.productId,
        productName: line.productName,
        productSku: line.productSku,
        productSlug: line.productSlug,
        productImage: line.productImage,
        weight: line.weight,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      })),
      { transaction }
    );

    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      const claimed = await productRepository.decrementStock(
        line.productId,
        line.quantity,
        transaction
      );

      if (!claimed) {
        // Another checkout took the stock between pricing and here.
        throw ApiError.conflict(`"${line.productName}" just went out of stock`);
      }

      // eslint-disable-next-line no-await-in-loop
      const fresh = await Product.findByPk(line.productId, {
        attributes: ['stock'],
        transaction,
      });

      // eslint-disable-next-line no-await-in-loop
      await Inventory.create(
        {
          productId: line.productId,
          changeQuantity: -line.quantity,
          stockAfter: fresh.stock,
          reason: INVENTORY_REASON.ORDER_PLACED,
          referenceType: 'order',
          referenceId: created.id,
          note: `Order ${orderNumber}`,
        },
        { transaction }
      );
    }

    await Payment.create(
      {
        orderId: created.id,
        method: payload.paymentMethod,
        // A UPI payment waits for the admin to match the reference against the
        // bank statement; COD is simply owed until delivery.
        status:
          payload.paymentMethod === PAYMENT_METHOD.UPI
            ? PAYMENT_STATUS.AWAITING_VERIFICATION
            : PAYMENT_STATUS.PENDING,
        amount: grandTotal,
        transactionReference: payload.transactionReference || null,
      },
      { transaction }
    );

    if (coupon) {
      await couponRepository.recordUsage(
        {
          couponId: coupon.id,
          userId: user?.id || null,
          orderId: created.id,
          discountAmount: discountTotal,
        },
        { transaction }
      );
      await couponRepository.incrementUsedCount(coupon.id, transaction);
    }

    return created;
  });

  const full = await orderRepository.findByOrderNumber(order.orderNumber);

  // Side effects that must not roll the order back if they fail.
  try {
    await notificationRepository.create({
      userId: null,
      type: NOTIFICATION_TYPE.ORDER,
      title: `New order ${full.orderNumber}`,
      message: `${full.customerName} placed an order worth ₹${full.grandTotal}`,
      link: `/admin/orders/${full.id}`,
    });
    await mailService.sendOrderConfirmationEmail(full);
  } catch (error) {
    logger.error(`Post-order side effects failed for ${full.orderNumber}:`, error);
  }

  return full;
};

const assertCanView = (order, user) => {
  if (!user) {
    // Guest orders are looked up by their unguessable order number.
    if (order.userId) throw ApiError.forbidden('Sign in to view this order');
    return;
  }

  const isOwner = String(order.userId) === String(user.id);
  const isAdmin = user.role?.name === ROLES.ADMIN;
  if (!isOwner && !isAdmin) throw ApiError.forbidden('You cannot view this order');
};

const getByOrderNumber = async (orderNumber, user = null) => {
  const order = await orderRepository.findByOrderNumber(orderNumber);
  if (!order) throw ApiError.notFound('Order not found');
  assertCanView(order, user);
  return order;
};

const getById = async (id) => {
  const order = await orderRepository.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  return order;
};

const listForUser = (userId, query) => orderRepository.list({ ...query, userId });

const listForAdmin = (query) => orderRepository.list(query);

/** Timestamp column written when an order reaches each status. */
const STATUS_TIMESTAMP = {
  [ORDER_STATUS.CONFIRMED]: 'confirmedAt',
  [ORDER_STATUS.PACKED]: 'packedAt',
  [ORDER_STATUS.SHIPPED]: 'shippedAt',
  [ORDER_STATUS.DELIVERED]: 'deliveredAt',
  [ORDER_STATUS.CANCELLED]: 'cancelledAt',
};

/** Returns stock to the shelf and records the reversal in the ledger. */
const restoreStock = async (order, transaction) => {
  for (const item of order.items || []) {
    if (!item.productId) continue;

    // eslint-disable-next-line no-await-in-loop
    await productRepository.incrementStock(item.productId, item.quantity, transaction);
    // eslint-disable-next-line no-await-in-loop
    const fresh = await Product.findByPk(item.productId, { attributes: ['stock'], transaction });

    // eslint-disable-next-line no-await-in-loop
    await Inventory.create(
      {
        productId: item.productId,
        changeQuantity: item.quantity,
        stockAfter: fresh.stock,
        reason: INVENTORY_REASON.ORDER_CANCELLED,
        referenceType: 'order',
        referenceId: order.id,
        note: `Cancelled order ${order.orderNumber}`,
      },
      { transaction }
    );
  }
};

const updateStatus = async (id, { status, adminNote, cancelReason }, actor) => {
  const order = await getById(id);

  if (order.status === status) {
    throw ApiError.badRequest(`This order is already marked as ${status}`);
  }

  if (!order.canTransitionTo(status)) {
    throw ApiError.badRequest(`An order cannot move from "${order.status}" to "${status}"`);
  }

  await sequelize.transaction(async (transaction) => {
    const changes = { status };
    const timestampField = STATUS_TIMESTAMP[status];
    if (timestampField) changes[timestampField] = new Date();
    if (adminNote !== undefined) changes.adminNote = adminNote;
    if (status === ORDER_STATUS.CANCELLED) changes.cancelReason = cancelReason || 'Cancelled by admin';

    await orderRepository.update(order, changes, { transaction });

    if (status === ORDER_STATUS.CANCELLED) {
      await restoreStock(order, transaction);
      if (order.payment) {
        order.payment.status =
          order.payment.status === PAYMENT_STATUS.PAID
            ? PAYMENT_STATUS.REFUNDED
            : PAYMENT_STATUS.FAILED;
        await order.payment.save({ transaction });
      }
    }

    // Delivered COD orders are, by definition, paid at that moment.
    if (
      status === ORDER_STATUS.DELIVERED &&
      order.payment &&
      order.payment.method === PAYMENT_METHOD.COD &&
      order.payment.status !== PAYMENT_STATUS.PAID
    ) {
      order.payment.status = PAYMENT_STATUS.PAID;
      order.payment.paidAt = new Date();
      order.payment.verifiedBy = actor?.id || null;
      order.payment.verifiedAt = new Date();
      await order.payment.save({ transaction });
    }
  });

  if (order.userId) {
    await notificationRepository.create({
      userId: order.userId,
      type: NOTIFICATION_TYPE.ORDER,
      title: `Order ${order.orderNumber} is now ${status}`,
      message: `Your order status changed to ${status}.`,
      link: `/account/orders/${order.orderNumber}`,
    });
  }

  return orderRepository.findById(order.id);
};

/** Customer-initiated cancellation, allowed only before the parcel ships. */
const cancelByCustomer = async (orderNumber, user, reason) => {
  const order = await getByOrderNumber(orderNumber, user);

  if (![ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status)) {
    throw ApiError.badRequest(
      'This order has already been packed. Contact support to cancel it.'
    );
  }

  await sequelize.transaction(async (transaction) => {
    await orderRepository.update(
      order,
      {
        status: ORDER_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason || 'Cancelled by customer',
      },
      { transaction }
    );

    await restoreStock(order, transaction);

    if (order.payment && order.payment.status !== PAYMENT_STATUS.PAID) {
      order.payment.status = PAYMENT_STATUS.FAILED;
      order.payment.failureReason = 'Order cancelled by customer';
      await order.payment.save({ transaction });
    }
  });

  await notificationRepository.create({
    userId: null,
    type: NOTIFICATION_TYPE.ORDER,
    title: `Order ${order.orderNumber} cancelled`,
    message: `${order.customerName} cancelled their order.`,
    link: `/admin/orders/${order.id}`,
  });

  return orderRepository.findById(order.id);
};

const updatePayment = async (id, { status, transactionReference, failureReason }, actor) => {
  const order = await getById(id);
  if (!order.payment) throw ApiError.notFound('This order has no payment record');

  order.payment.status = status;
  if (transactionReference !== undefined) {
    order.payment.transactionReference = transactionReference;
  }
  if (status === PAYMENT_STATUS.PAID) {
    order.payment.paidAt = new Date();
    order.payment.verifiedBy = actor?.id || null;
    order.payment.verifiedAt = new Date();
    order.payment.failureReason = null;
  }
  if (status === PAYMENT_STATUS.FAILED) {
    order.payment.failureReason = failureReason || 'Payment could not be verified';
  }

  await order.payment.save();
  return orderRepository.findById(order.id);
};

/** Flat data for the printable invoice; the client owns the presentation. */
const buildInvoice = async (id) => {
  const order = await getById(id);
  const settings = await settingService.getPublicSettings();

  return {
    order,
    seller: {
      name: settings.site_name,
      email: settings.contact_email,
      phone: settings.contact_phone,
      address: settings.contact_address,
    },
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  quote,
  create,
  getByOrderNumber,
  getById,
  listForUser,
  listForAdmin,
  updateStatus,
  cancelByCustomer,
  updatePayment,
  buildInvoice,
};
