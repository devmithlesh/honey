'use strict';

const { Op, literal, where: sqlWhere, col } = require('sequelize');

const { Product, ProductImage, Category, sequelize } = require('../models');
const { buildPagination } = require('../utils/pagination');
const { LOW_STOCK_THRESHOLD } = require('../constants');

const imageInclude = {
  model: ProductImage,
  as: 'images',
  attributes: ['id', 'url', 'altText', 'isPrimary', 'sortOrder'],
  separate: true,
  order: [
    ['isPrimary', 'DESC'],
    ['sortOrder', 'ASC'],
    ['id', 'ASC'],
  ],
};

const categoryInclude = {
  model: Category,
  as: 'category',
  attributes: ['id', 'name', 'slug'],
};

/**
 * Effective price as SQL, so price filtering and price sorting both respect an
 * active discount instead of the list price.
 */
const EFFECTIVE_PRICE = literal(
  'CASE WHEN "Product"."discount_price" IS NOT NULL AND "Product"."discount_price" > 0 ' +
    'AND "Product"."discount_price" < "Product"."price" ' +
    'THEN "Product"."discount_price" ELSE "Product"."price" END'
);

const SORT_MAP = {
  newest: [['createdAt', 'DESC']],
  oldest: [['createdAt', 'ASC']],
  'price-asc': [[EFFECTIVE_PRICE, 'ASC']],
  'price-desc': [[EFFECTIVE_PRICE, 'DESC']],
  'name-asc': [['name', 'ASC']],
  'name-desc': [['name', 'DESC']],
  rating: [
    ['ratingAverage', 'DESC'],
    ['ratingCount', 'DESC'],
  ],
  popular: [
    ['isFeatured', 'DESC'],
    ['ratingCount', 'DESC'],
  ],
};

/**
 * Storefront and admin product listing.
 *
 * `includeInactive` is the only difference between the two callers, so the
 * query stays in one place rather than being duplicated per audience.
 */
const list = async ({
  search,
  categorySlug,
  categoryId,
  minPrice,
  maxPrice,
  minRating,
  featured,
  inStock,
  lowStock,
  includeInactive = false,
  sort = 'newest',
  page,
  limit,
}) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const where = {};
  const and = [];

  if (!includeInactive) where.isActive = true;
  if (typeof featured === 'boolean') where.isFeatured = featured;
  if (categoryId) where.categoryId = categoryId;
  if (inStock === true) where.stock = { [Op.gt]: 0 };
  if (minRating) where.ratingAverage = { [Op.gte]: minRating };

  if (lowStock === true) {
    and.push(sqlWhere(col('Product.stock'), Op.lte, col('Product.low_stock_threshold')));
    and.push({ stock: { [Op.gt]: 0 } });
  }

  if (search) {
    const term = `%${search}%`;
    and.push({
      [Op.or]: [
        { name: { [Op.iLike]: term } },
        { shortDescription: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
        { sku: { [Op.iLike]: term } },
      ],
    });
  }

  if (minPrice !== undefined && minPrice !== null) {
    and.push(sqlWhere(EFFECTIVE_PRICE, Op.gte, minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    and.push(sqlWhere(EFFECTIVE_PRICE, Op.lte, maxPrice));
  }

  if (and.length > 0) where[Op.and] = and;

  const include = [
    imageInclude,
    categorySlug
      ? { ...categoryInclude, where: { slug: categorySlug }, required: true }
      : categoryInclude,
  ];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    order: SORT_MAP[sort] || SORT_MAP.newest,
    limit: take,
    offset,
    distinct: true,
    subQuery: false,
  });

  return { rows, count, page: currentPage, limit: take };
};

const findBySlug = (slug, { includeInactive = false } = {}) => {
  const where = { slug };
  if (!includeInactive) where.isActive = true;
  return Product.findOne({ where, include: [imageInclude, categoryInclude] });
};

const findById = (id, options = {}) =>
  Product.findByPk(id, { include: [imageInclude, categoryInclude], ...options });

const findByIds = (ids) =>
  Product.findAll({ where: { id: { [Op.in]: ids } }, include: [imageInclude, categoryInclude] });

const slugExists = async (slug, excludeId = null) => {
  const where = { slug };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await Product.count({ where, paranoid: false });
  return count > 0;
};

const skuExists = async (sku, excludeId = null) => {
  const where = { sku: String(sku).trim().toUpperCase() };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await Product.count({ where, paranoid: false });
  return count > 0;
};

/** Same category, excluding the product itself; falls back to featured items. */
const findRelated = async (product, take = 4) => {
  const sameCategory = await Product.findAll({
    where: {
      categoryId: product.categoryId,
      id: { [Op.ne]: product.id },
      isActive: true,
    },
    include: [imageInclude, categoryInclude],
    order: [
      ['isFeatured', 'DESC'],
      ['ratingAverage', 'DESC'],
    ],
    limit: take,
  });

  if (sameCategory.length >= take) return sameCategory;

  const excludeIds = [product.id, ...sameCategory.map((item) => item.id)];
  const filler = await Product.findAll({
    where: { id: { [Op.notIn]: excludeIds }, isActive: true },
    include: [imageInclude, categoryInclude],
    order: [['isFeatured', 'DESC']],
    limit: take - sameCategory.length,
  });

  return [...sameCategory, ...filler];
};

const create = (payload, options = {}) => Product.create(payload, options);

const update = async (product, payload, options = {}) => {
  product.set(payload);
  await product.save(options);
  return product;
};

const destroy = (product) => product.destroy();

const countAll = (options = {}) => Product.count(options);

const countLowStock = () =>
  Product.count({
    where: {
      isActive: true,
      [Op.and]: [sqlWhere(col('stock'), Op.lte, col('low_stock_threshold'))],
    },
  });

const findLowStock = (take = 8) =>
  Product.findAll({
    where: {
      isActive: true,
      [Op.and]: [sqlWhere(col('stock'), Op.lte, col('low_stock_threshold'))],
    },
    attributes: ['id', 'name', 'slug', 'sku', 'stock', 'lowStockThreshold'],
    order: [['stock', 'ASC']],
    limit: take,
  });

/**
 * Atomic stock decrement guarded by the row's own value, so two concurrent
 * checkouts can never oversell the last jar.
 */
const decrementStock = async (productId, quantity, transaction) => {
  const [affected] = await Product.update(
    { stock: literal(`stock - ${Number.parseInt(quantity, 10)}`) },
    {
      where: { id: productId, stock: { [Op.gte]: quantity } },
      transaction,
    }
  );
  return affected === 1;
};

const incrementStock = (productId, quantity, transaction) =>
  Product.increment({ stock: Number.parseInt(quantity, 10) }, { where: { id: productId }, transaction });

/** Recomputes rating aggregates from approved reviews only. */
const refreshRating = async (productId) => {
  const [[row]] = await sequelize.query(
    `SELECT COALESCE(AVG(rating), 0)::numeric(3,2) AS average, COUNT(*)::int AS total
       FROM reviews
      WHERE product_id = :productId AND status = 'approved' AND deleted_at IS NULL`,
    { replacements: { productId } }
  );

  await Product.update(
    { ratingAverage: row.average, ratingCount: row.total },
    { where: { id: productId } }
  );

  return { ratingAverage: row.average, ratingCount: row.total };
};

module.exports = {
  LOW_STOCK_THRESHOLD,
  imageInclude,
  categoryInclude,
  list,
  findBySlug,
  findById,
  findByIds,
  slugExists,
  skuExists,
  findRelated,
  create,
  update,
  destroy,
  countAll,
  countLowStock,
  findLowStock,
  decrementStock,
  incrementStock,
  refreshRating,
};
