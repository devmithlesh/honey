'use strict';

const Joi = require('joi');

const { pagination, booleanish } = require('./common.validator');
const { COUPON_TYPE } = require('../constants');

const baseFields = {
  code: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9_-]{3,50}$/)
    .messages({
      'string.pattern.base': 'Coupon codes may use letters, numbers, hyphens and underscores',
    }),
  description: Joi.string().trim().max(255).allow('', null),
  type: Joi.string().valid(...Object.values(COUPON_TYPE)),
  value: Joi.number().precision(2).min(0.01),
  minOrderAmount: Joi.number().precision(2).min(0).default(0),
  maxDiscountAmount: Joi.number().precision(2).min(0).allow(null, ''),
  usageLimit: Joi.number().integer().min(1).allow(null, ''),
  usageLimitPerUser: Joi.number().integer().min(0).default(1),
  startsAt: Joi.date().iso().allow(null, ''),
  expiresAt: Joi.date().iso().allow(null, ''),
  isActive: booleanish.default(true),
};

const withBusinessRules = (schema) =>
  schema
    .custom((value, helpers) => {
      if (value.type === COUPON_TYPE.PERCENTAGE && value.value > 100) {
        return helpers.error('any.invalid');
      }
      if (value.startsAt && value.expiresAt && new Date(value.expiresAt) <= new Date(value.startsAt)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid':
        'Check the coupon rules: a percentage cannot exceed 100% and the expiry must follow the start date',
    });

const createCouponSchema = withBusinessRules(
  Joi.object(baseFields).fork(['code', 'type', 'value'], (schema) => schema.required())
);

const updateCouponSchema = withBusinessRules(
  Joi.object(baseFields).min(1).messages({ 'object.min': 'Provide at least one field to update' })
);

const listQuerySchema = Joi.object({
  ...pagination,
  search: Joi.string().trim().max(120).allow(''),
  isActive: booleanish,
});

const validateCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(50).required(),
  subtotal: Joi.number().min(0).required(),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  listQuerySchema,
  validateCouponSchema,
};
