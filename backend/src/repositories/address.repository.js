'use strict';

const { Op } = require('sequelize');

const { Address } = require('../models');

const listByUser = (userId) =>
  Address.findAll({
    where: { userId },
    order: [
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });

const findByIdForUser = (id, userId) => Address.findOne({ where: { id, userId } });

const findDefaultForUser = (userId) => Address.findOne({ where: { userId, isDefault: true } });

const create = (payload) => Address.create(payload);

const update = async (address, payload) => {
  address.set(payload);
  await address.save();
  return address;
};

const destroy = (address) => address.destroy();

const countForUser = (userId) => Address.count({ where: { userId } });

/**
 * Exactly one default per customer: clearing the flag on the others is done in
 * one statement so no window exists where two addresses are both default.
 */
const clearDefaultForUser = (userId, exceptId = null) => {
  const where = { userId, isDefault: true };
  if (exceptId) where.id = { [Op.ne]: exceptId };
  return Address.update({ isDefault: false }, { where });
};

module.exports = {
  listByUser,
  findByIdForUser,
  findDefaultForUser,
  create,
  update,
  destroy,
  countForUser,
  clearDefaultForUser,
};
