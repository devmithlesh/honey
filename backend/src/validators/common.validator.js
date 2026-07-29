'use strict';

const Joi = require('joi');

const { PAGINATION } = require('../constants');

/**
 * Building blocks shared by every validator, so rules such as "what counts as a
 * valid Indian mobile number" are defined exactly once.
 */
const id = Joi.number().integer().positive();

const idParam = Joi.object({
  id: id.required().messages({ 'any.required': 'A record id is required' }),
});

const slugParam = Joi.object({
  slug: Joi.string()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(200)
    .required()
    .messages({ 'string.pattern.base': 'slug may contain lowercase letters, numbers and hyphens' }),
});

const orderNumberParam = Joi.object({
  orderNumber: Joi.string()
    .pattern(/^HB-\d{8}-[A-F0-9]{6}$/i)
    .required()
    .messages({ 'string.pattern.base': 'That does not look like a valid order number' }),
});

const pagination = {
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
};

const email = Joi.string()
  .email({ tlds: { allow: false } })
  .max(190)
  .lowercase()
  .trim();

// Accepts +91 / 0 prefixes and 10-digit local numbers, plus generous
// international forms, without being so strict that a valid number is rejected.
const phone = Joi.string()
  .pattern(/^[+]?[\d\s\-()]{7,20}$/)
  .messages({ 'string.pattern.base': 'Enter a valid phone number' });

/**
 * Passwords must survive an offline cracking attempt, so a mix of character
 * classes is required rather than length alone.
 */
const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter and one number',
  });

const addressObject = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  phone: phone.required(),
  line1: Joi.string().trim().min(3).max(255).required(),
  line2: Joi.string().trim().max(255).allow('', null),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  postalCode: Joi.string()
    .trim()
    .pattern(/^\d{4,10}$/)
    .required()
    .messages({ 'string.pattern.base': 'Enter a valid postal code' }),
  country: Joi.string().trim().max(100).default('India'),
});

/**
 * `multipart/form-data` delivers every field as a string, so booleans and
 * numbers arriving alongside an upload need explicit coercion.
 */
const booleanish = Joi.boolean().truthy('true', '1', 'yes').falsy('false', '0', 'no', '');

module.exports = {
  id,
  idParam,
  slugParam,
  orderNumberParam,
  pagination,
  email,
  phone,
  password,
  addressObject,
  booleanish,
};
