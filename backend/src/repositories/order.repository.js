'use strict';

const { Op, fn, col, literal } = require('sequelize');

const { Order, OrderItem, Payment, User, sequelize } = require('../models');
const { buildPagination } = require('../utils/pagination');
const { ORDER_STATUS } = require('../constants');

const itemsInclude = {
  model: OrderItem,
  as: 'items',
  separate: true,
  order: [['id', 'ASC']],
};

const paymentInclude = { model: Payment, as: 'payment' };

const customerInclude = {
  model: User,
  as: 'customer',
  attributes: ['id', 'name', 'email', 'phone'],
};

const fullIncludes = [itemsInclude, paymentInclude, customerInclude];

const list = async ({ status, search, userId, from, to, page, limit, sort = 'newest' }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  if (from || to) {
    where.placedAt = {};
    if (from) where.placedAt[Op.gte] = from;
    if (to) where.placedAt[Op.lte] = to;
  }

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { orderNumber: { [Op.iLike]: term } },
      { customerName: { [Op.iLike]: term } },
      { customerEmail: { [Op.iLike]: term } },
      { customerPhone: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await Order.findAndCountAll({
    where,
    include: [itemsInclude, paymentInclude],
    order: sort === 'oldest' ? [['placedAt', 'ASC']] : [['placedAt', 'DESC']],
    limit: take,
    offset,
    distinct: true,
  });

  return { rows, count, page: currentPage, limit: take };
};

const findById = (id, options = {}) =>
  Order.findByPk(id, { include: fullIncludes, ...options });

const findByOrderNumber = (orderNumber, options = {}) =>
  Order.findOne({ where: { orderNumber }, include: fullIncludes, ...options });

const create = (payload, options = {}) => Order.create(payload, options);

const bulkCreateItems = (items, options = {}) => OrderItem.bulkCreate(items, options);

const update = async (order, payload, options = {}) => {
  order.set(payload);
  await order.save(options);
  return order;
};

const countAll = (where = {}) => Order.count({ where });

const countByStatus = async () => {
  const rows = await Order.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'total']],
    group: ['status'],
    raw: true,
  });

  const base = Object.fromEntries(Object.values(ORDER_STATUS).map((status) => [status, 0]));
  rows.forEach((row) => {
    base[row.status] = Number.parseInt(row.total, 10);
  });
  return base;
};

/**
 * Revenue counts only orders that were not cancelled — a cancelled order has
 * no money behind it, whether or not it was paid at some point.
 */
const sumRevenue = async ({ from, to } = {}) => {
  const where = { status: { [Op.ne]: ORDER_STATUS.CANCELLED } };
  if (from || to) {
    where.placedAt = {};
    if (from) where.placedAt[Op.gte] = from;
    if (to) where.placedAt[Op.lte] = to;
  }

  const total = await Order.sum('grandTotal', { where });
  return Number.parseFloat(total || 0);
};

/** Daily revenue for the dashboard chart, zero-filled by the caller. */
const revenueByDay = async (days = 14) => {
  const rows = await sequelize.query(
    `SELECT to_char(date_trunc('day', placed_at), 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(grand_total), 0)::numeric(12,2) AS revenue
       FROM orders
      WHERE deleted_at IS NULL
        AND status <> 'cancelled'
        AND placed_at >= NOW() - (:days || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC`,
    { replacements: { days }, type: sequelize.QueryTypes.SELECT }
  );

  return rows.map((row) => ({
    day: row.day,
    orders: Number.parseInt(row.orders, 10),
    revenue: Number.parseFloat(row.revenue),
  }));
};

const findRecent = (take = 8) =>
  Order.findAll({
    include: [itemsInclude, paymentInclude],
    order: [['placedAt', 'DESC']],
    limit: take,
  });

const topProducts = async (take = 5) =>
  sequelize.query(
    `SELECT oi.product_id AS "productId",
            oi.product_name AS "productName",
            oi.product_slug AS "productSlug",
            SUM(oi.quantity)::int AS "unitsSold",
            SUM(oi.line_total)::numeric(12,2) AS "revenue"
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'cancelled' AND o.deleted_at IS NULL
      GROUP BY 1, 2, 3
      ORDER BY "unitsSold" DESC
      LIMIT :take`,
    { replacements: { take }, type: sequelize.QueryTypes.SELECT }
  );

/**
 * Whether a customer has a delivered order containing this product — the check
 * behind the "verified purchase" badge on reviews.
 */
const hasPurchasedProduct = async (userId, productId) => {
  const count = await OrderItem.count({
    where: { productId },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: [],
        required: true,
        where: { userId, status: { [Op.notIn]: [ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING] } },
      },
    ],
  });
  return count > 0;
};

const findDeliveredOrderForProduct = (userId, productId) =>
  OrderItem.findOne({
    where: { productId },
    include: [
      {
        model: Order,
        as: 'order',
        required: true,
        where: { userId, status: { [Op.notIn]: [ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING] } },
        attributes: ['id'],
      },
    ],
    order: [['id', 'DESC']],
  });

const customerSummary = async (userId) => {
  const [row] = await sequelize.query(
    `SELECT COUNT(*)::int AS "totalOrders",
            COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN grand_total ELSE 0 END), 0)::numeric(12,2) AS "totalSpent",
            COUNT(*) FILTER (WHERE status IN ('pending','confirmed','packed','shipped'))::int AS "activeOrders",
            COUNT(*) FILTER (WHERE status = 'delivered')::int AS "deliveredOrders"
       FROM orders
      WHERE user_id = :userId AND deleted_at IS NULL`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );

  return {
    totalOrders: Number.parseInt(row.totalOrders, 10),
    totalSpent: Number.parseFloat(row.totalSpent),
    activeOrders: Number.parseInt(row.activeOrders, 10),
    deliveredOrders: Number.parseInt(row.deliveredOrders, 10),
  };
};

const countOrderNumber = (orderNumber) => Order.count({ where: { orderNumber }, paranoid: false });

module.exports = {
  itemsInclude,
  paymentInclude,
  customerInclude,
  list,
  findById,
  findByOrderNumber,
  create,
  bulkCreateItems,
  update,
  countAll,
  countByStatus,
  sumRevenue,
  revenueByDay,
  findRecent,
  topProducts,
  hasPurchasedProduct,
  findDeliveredOrderForProduct,
  customerSummary,
  countOrderNumber,
  literal,
};
