'use strict';

const { Op, literal } = require('sequelize');

const { Coupon, CouponUsage } = require('../models');
const { buildPagination } = require('../utils/pagination');

const list = async ({ search, isActive, page, limit }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const where = {};
  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [{ code: { [Op.iLike]: term } }, { description: { [Op.iLike]: term } }];
  }

  const { rows, count } = await Coupon.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: take,
    offset,
    distinct: true,
  });

  return { rows, count, page: currentPage, limit: take };
};

const findById = (id) => Coupon.findByPk(id);

const findByCode = (code) =>
  Coupon.findOne({ where: { code: String(code || '').trim().toUpperCase() } });

const codeExists = async (code, excludeId = null) => {
  const where = { code: String(code || '').trim().toUpperCase() };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await Coupon.count({ where, paranoid: false });
  return count > 0;
};

const create = (payload) => Coupon.create(payload);

const update = async (coupon, payload) => {
  coupon.set(payload);
  await coupon.save();
  return coupon;
};

const destroy = (coupon) => coupon.destroy();

const countUsageByUser = (couponId, userId) =>
  userId ? CouponUsage.count({ where: { couponId, userId } }) : Promise.resolve(0);

const recordUsage = (payload, options = {}) => CouponUsage.create(payload, options);

/**
 * Increment in SQL rather than read-modify-write, so two simultaneous
 * checkouts cannot both read the same `usedCount` and lose one increment.
 */
const incrementUsedCount = (couponId, transaction) =>
  Coupon.update(
    { usedCount: literal('used_count + 1') },
    { where: { id: couponId }, transaction }
  );

const countActive = () =>
  Coupon.count({
    where: {
      isActive: true,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    },
  });

module.exports = {
  list,
  findById,
  findByCode,
  codeExists,
  create,
  update,
  destroy,
  countUsageByUser,
  recordUsage,
  incrementUsedCount,
  countActive,
};
