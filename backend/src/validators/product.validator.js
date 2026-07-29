'use strict';

const Joi = require('joi');

const { id, pagination, booleanish } = require('./common.validator');

const SORT_VALUES = [
  'newest',
  'oldest',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'rating',
  'popular',
];

const listQuerySchema = Joi.object({
  ...pagination,
  search: Joi.string().trim().max(120).allow(''),
  category: Joi.string().trim().max(150).allow(''),
  categoryId: id,
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  minRating: Joi.number().min(1).max(5),
  featured: booleanish,
  inStock: booleanish,
  sort: Joi.string().valid(...SORT_VALUES).default('newest'),
})
  /**
   * The two price bounds are compared here rather than with
   * `Joi.ref('minPrice')` on `maxPrice`: a `ref` to an absent key resolves to
   * `undefined`, which made a max-price-only filter — exactly what the shop's
   * price slider sends — fail validation.
   */
  .custom((value, helpers) => {
    const { minPrice, maxPrice } = value;
    if (minPrice !== undefined && maxPrice !== undefined && maxPrice <= minPrice) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({ 'any.invalid': 'Maximum price must be higher than the minimum price' });

const adminListQuerySchema = listQuerySchema.keys({
  lowStock: booleanish,
  includeInactive: booleanish.default(true),
});

/**
 * Product write payload. Numeric fields are coerced because the same schema
 * serves JSON requests and `multipart/form-data` uploads, where every value
 * arrives as a string.
 */
const baseProductFields = {
  name: Joi.string().trim().min(2).max(180),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(200)
    .messages({ 'string.pattern.base': 'Slug may contain lowercase letters, numbers and hyphens' }),
  sku: Joi.string().trim().uppercase().max(64),
  categoryId: id,
  shortDescription: Joi.string().trim().max(300).allow('', null),
  description: Joi.string().trim().max(20000).allow('', null),
  benefits: Joi.string().trim().max(5000).allow('', null),
  ingredients: Joi.string().trim().max(5000).allow('', null),
  price: Joi.number().precision(2).min(0),
  discountPrice: Joi.number().precision(2).min(0).allow(null, ''),
  weight: Joi.string().trim().max(50).allow('', null),
  stock: Joi.number().integer().min(0),
  lowStockThreshold: Joi.number().integer().min(0).default(10),
  isFeatured: booleanish,
  isActive: booleanish,
  metaTitle: Joi.string().trim().max(180).allow('', null),
  metaDescription: Joi.string().trim().max(300).allow('', null),
};

const createProductSchema = Joi.object(baseProductFields)
  .fork(['name', 'categoryId', 'price', 'stock'], (schema) => schema.required())
  .custom((value, helpers) => {
    if (
      value.discountPrice !== null &&
      value.discountPrice !== undefined &&
      value.discountPrice !== '' &&
      Number(value.discountPrice) >= Number(value.price)
    ) {
      return helpers.error('any.custom', { message: 'Discount price must be below the price' });
    }
    return value;
  })
  .messages({ 'any.custom': 'Discount price must be below the regular price' });

const updateProductSchema = Joi.object(baseProductFields).min(1).messages({
  'object.min': 'Provide at least one field to update',
});

const imageIdParamSchema = Joi.object({
  id: id.required(),
  imageId: id.required(),
});

module.exports = {
  SORT_VALUES,
  listQuerySchema,
  adminListQuerySchema,
  createProductSchema,
  updateProductSchema,
  imageIdParamSchema,
};
