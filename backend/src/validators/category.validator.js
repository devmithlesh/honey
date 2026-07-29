'use strict';

const Joi = require('joi');

const { id, booleanish } = require('./common.validator');

const baseFields = {
  name: Joi.string().trim().min(2).max(120),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(150)
    .messages({ 'string.pattern.base': 'Slug may contain lowercase letters, numbers and hyphens' }),
  parentId: id.allow(null, ''),
  description: Joi.string().trim().max(5000).allow('', null),
  imageUrl: Joi.string().uri().max(500).allow('', null),
  isActive: booleanish,
  sortOrder: Joi.number().integer().min(0).default(0),
  metaTitle: Joi.string().trim().max(180).allow('', null),
  metaDescription: Joi.string().trim().max(300).allow('', null),
};

const createCategorySchema = Joi.object(baseFields).fork(['name'], (schema) => schema.required());

const updateCategorySchema = Joi.object(baseFields).min(1).messages({
  'object.min': 'Provide at least one field to update',
});

module.exports = { createCategorySchema, updateCategorySchema };
