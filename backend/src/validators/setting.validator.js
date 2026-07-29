'use strict';

const Joi = require('joi');

/**
 * Settings are a free-form key/value map, so the schema constrains the shape
 * (known-safe keys, scalar values) rather than enumerating every field — new
 * keys can be added by a migration without touching this file.
 */
const settingKey = Joi.string()
  .pattern(/^[a-z][a-z0-9_]{1,99}$/)
  .messages({
    'string.pattern.base': 'Setting keys must be lowercase snake_case identifiers',
  });

const updateSettingsSchema = Joi.object()
  .pattern(settingKey, Joi.alternatives().try(Joi.string().allow(''), Joi.number(), Joi.boolean()))
  .min(1)
  .messages({ 'object.min': 'Provide at least one setting to update' });

module.exports = { updateSettingsSchema };
