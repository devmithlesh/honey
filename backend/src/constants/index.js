'use strict';

const ROLES = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer',
});

const ROLE_VALUES = Object.freeze(Object.values(ROLES));

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));

/**
 * Allowed forward transitions. An order may also be cancelled from any state
 * that has not yet been delivered — enforced in the order service.
 */
const ORDER_STATUS_FLOW = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

const PAYMENT_METHOD = Object.freeze({
  COD: 'cod',
  UPI: 'upi',
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  AWAITING_VERIFICATION: 'awaiting_verification',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

const COUPON_TYPE = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
});

const ADDRESS_TYPE = Object.freeze({
  SHIPPING: 'shipping',
  BILLING: 'billing',
});

const NOTIFICATION_TYPE = Object.freeze({
  ORDER: 'order',
  REVIEW: 'review',
  STOCK: 'stock',
  SYSTEM: 'system',
});

const INVENTORY_REASON = Object.freeze({
  ORDER_PLACED: 'order_placed',
  ORDER_CANCELLED: 'order_cancelled',
  RESTOCK: 'restock',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
});

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
});

const LOW_STOCK_THRESHOLD = 10;

module.exports = {
  ROLES,
  ROLE_VALUES,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  ORDER_STATUS_FLOW,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  REVIEW_STATUS,
  COUPON_TYPE,
  ADDRESS_TYPE,
  NOTIFICATION_TYPE,
  INVENTORY_REASON,
  PAGINATION,
  LOW_STOCK_THRESHOLD,
};
