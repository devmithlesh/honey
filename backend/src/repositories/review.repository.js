'use strict';

const { fn, col } = require('sequelize');

const { Review, User, Product } = require('../models');
const { buildPagination } = require('../utils/pagination');
const { REVIEW_STATUS } = require('../constants');

const authorInclude = {
  model: User,
  as: 'author',
  attributes: ['id', 'name', 'avatarUrl'],
};

const productInclude = {
  model: Product,
  as: 'product',
  attributes: ['id', 'name', 'slug'],
};

const listForProduct = async ({ productId, page, limit }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const { rows, count } = await Review.findAndCountAll({
    where: { productId, status: REVIEW_STATUS.APPROVED },
    include: [authorInclude],
    order: [['createdAt', 'DESC']],
    limit: take,
    offset,
    distinct: true,
  });

  return { rows, count, page: currentPage, limit: take };
};

/** Admin moderation queue: every status, newest first, with product context. */
const listAll = async ({ status, productId, page, limit }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const where = {};
  if (status) where.status = status;
  if (productId) where.productId = productId;

  const { rows, count } = await Review.findAndCountAll({
    where,
    include: [authorInclude, productInclude],
    order: [['createdAt', 'DESC']],
    limit: take,
    offset,
    distinct: true,
  });

  return { rows, count, page: currentPage, limit: take };
};

const findById = (id) => Review.findByPk(id, { include: [authorInclude, productInclude] });

const findByUserAndProduct = (userId, productId) =>
  Review.findOne({ where: { userId, productId } });

const create = (payload) => Review.create(payload);

const update = async (review, payload) => {
  review.set(payload);
  await review.save();
  return review;
};

const destroy = (review) => review.destroy();

const countByStatus = (status) => Review.count({ where: status ? { status } : {} });

/** Star histogram for the product page ("how many 5-star reviews"). */
const ratingBreakdown = async (productId) => {
  const rows = await Review.findAll({
    attributes: ['rating', [fn('COUNT', col('id')), 'total']],
    where: { productId, status: REVIEW_STATUS.APPROVED },
    group: ['rating'],
    raw: true,
  });

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rows.forEach((row) => {
    breakdown[row.rating] = Number.parseInt(row.total, 10);
  });
  return breakdown;
};

module.exports = {
  listForProduct,
  listAll,
  findById,
  findByUserAndProduct,
  create,
  update,
  destroy,
  countByStatus,
  ratingBreakdown,
};
