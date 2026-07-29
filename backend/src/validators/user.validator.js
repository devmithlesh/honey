'use strict';

const Joi = require('joi');

const { id, pagination, email, phone, booleanish, addressObject } = require('./common.validator');
const { ADDRESS_TYPE } = require('../constants');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  email: email,
  phone: phone.allow('', null),
})
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

const createAddressSchema = addressObject.keys({
  label: Joi.string().trim().max(50).allow('', null),
  type: Joi.string()
    .valid(...Object.values(ADDRESS_TYPE))
    .default(ADDRESS_TYPE.SHIPPING),
  isDefault: booleanish.default(false),
});

// Every field optional on update, but at least one must be present.
const updateAddressSchema = createAddressSchema
  .fork(Object.keys(createAddressSchema.describe().keys), (schema) => schema.optional())
  .min(1)
  .messages({ 'object.min': 'Provide at least one field to update' });

const customerListQuerySchema = Joi.object({
  ...pagination,
  search: Joi.string().trim().max(120).allow(''),
  isActive: booleanish,
  roleId: id,
  sort: Joi.string().valid('newest', 'oldest', 'name').default('newest'),
});

const setCustomerStatusSchema = Joi.object({
  isActive: booleanish.required(),
});

const wishlistItemSchema = Joi.object({
  productId: id.required(),
});

const productIdParamSchema = Joi.object({
  productId: id.required(),
});

module.exports = {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  customerListQuerySchema,
  setCustomerStatusSchema,
  wishlistItemSchema,
  productIdParamSchema,
};
