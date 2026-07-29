'use strict';

const { Op, fn, col, literal } = require('sequelize');

const { Category, Product } = require('../models');

const findAll = ({ includeInactive = false, withProductCount = false } = {}) => {
  const where = includeInactive ? {} : { isActive: true };

  const options = {
    where,
    order: [
      ['sortOrder', 'ASC'],
      ['name', 'ASC'],
    ],
  };

  if (withProductCount) {
    // A correlated subquery keeps this a single round-trip and avoids the
    // GROUP BY that a JOIN + COUNT would force onto every selected column.
    options.attributes = {
      include: [
        [
          literal(
            '(SELECT COUNT(*)::int FROM products AS p WHERE p.category_id = "Category".id AND p.deleted_at IS NULL AND p.is_active = true)'
          ),
          'productCount',
        ],
      ],
    };
  }

  return Category.findAll(options);
};

const findById = (id) => Category.findByPk(id);

const findBySlug = (slug, { includeInactive = false } = {}) => {
  const where = { slug };
  if (!includeInactive) where.isActive = true;
  return Category.findOne({ where });
};

const slugExists = async (slug, excludeId = null) => {
  const where = { slug };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await Category.count({ where, paranoid: false });
  return count > 0;
};

const create = (payload) => Category.create(payload);

const update = async (category, payload) => {
  category.set(payload);
  await category.save();
  return category;
};

const destroy = (category) => category.destroy();

/** Guards deletion: a category that still holds products must not disappear. */
const countProducts = (categoryId) => Product.count({ where: { categoryId } });

const countAll = () => Category.count();

const findWithProductTotals = () =>
  Category.findAll({
    attributes: ['id', 'name', 'slug', [fn('COUNT', col('products.id')), 'productCount']],
    include: [{ model: Product, as: 'products', attributes: [] }],
    group: ['Category.id'],
    order: [['name', 'ASC']],
  });

module.exports = {
  findAll,
  findById,
  findBySlug,
  slugExists,
  create,
  update,
  destroy,
  countProducts,
  countAll,
  findWithProductTotals,
};
