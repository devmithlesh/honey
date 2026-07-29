'use strict';

const Joi = require('joi');

const { id, pagination, email, phone, addressObject } = require('./common.validator');
const { ORDER_STATUS_VALUES, PAYMENT_METHOD, PAYMENT_STATUS } = require('../constants');

const cartItemSchema = Joi.object({
  productId: id.required(),
  quantity: Joi.number().integer().min(1).max(99).required().messages({
    'number.max': 'You can order at most 99 units of a single product',
  }),
});

const cartItemsSchema = Joi.array().items(cartItemSchema).min(1).max(50).required().messages({
  'array.min': 'Your cart is empty',
  'array.max': 'A single order can contain at most 50 different products',
});

/** Checkout preview — same cart shape as the order, but nothing is written. */
const quoteSchema = Joi.object({
  items: cartItemsSchema,
  couponCode: Joi.string().trim().uppercase().max(50).allow('', null),
});

const createOrderSchema = Joi.object({
  items: cartItemsSchema,
  customerName: Joi.string().trim().min(2).max(120).required(),
  customerEmail: email.required(),
  customerPhone: phone.required(),
  shippingAddress: addressObject.required(),
  // Omitted when the customer ticks "billing same as shipping".
  billingAddress: addressObject.allow(null),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHOD))
    .required()
    .messages({ 'any.only': 'Choose either cash on delivery or UPI' }),
  // Only meaningful for UPI: the reference the customer read off their app.
  transactionReference: Joi.string().trim().max(120).allow('', null),
  couponCode: Joi.string().trim().uppercase().max(50).allow('', null),
  customerNote: Joi.string().trim().max(1000).allow('', null),
}).custom((value, helpers) => {
  if (value.paymentMethod === PAYMENT_METHOD.UPI && !value.transactionReference) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'UPI reference presence');

const listQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid(...ORDER_STATUS_VALUES),
  search: Joi.string().trim().max(120).allow(''),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  sort: Joi.string().valid('newest', 'oldest').default('newest'),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...ORDER_STATUS_VALUES)
    .required(),
  adminNote: Joi.string().trim().max(1000).allow('', null),
  cancelReason: Joi.string().trim().max(255).allow('', null),
});

const updatePaymentSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .required(),
  transactionReference: Joi.string().trim().max(120).allow('', null),
  failureReason: Joi.string().trim().max(255).allow('', null),
});

const cancelSchema = Joi.object({
  reason: Joi.string().trim().max(255).allow('', null),
});

module.exports = {
  quoteSchema,
  createOrderSchema,
  listQuerySchema,
  updateStatusSchema,
  updatePaymentSchema,
  cancelSchema,
};
