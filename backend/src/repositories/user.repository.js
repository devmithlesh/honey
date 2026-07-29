'use strict';

const { Op } = require('sequelize');

const { User, Role, Order } = require('../models');
const { buildPagination } = require('../utils/pagination');

const roleInclude = { model: Role, as: 'role', attributes: ['id', 'name'] };

/**
 * Data access for users. Every query that needs the password hash opts in
 * explicitly through the `withSecrets` scope, so nothing leaks by accident.
 */
const findById = (id, options = {}) =>
  User.findByPk(id, { include: [roleInclude], ...options });

const findByEmail = (email, { withSecrets = false } = {}) => {
  const scoped = withSecrets ? User.scope('withSecrets') : User;
  return scoped.findOne({
    where: { email: String(email || '').trim().toLowerCase() },
    include: [roleInclude],
  });
};

const findByIdWithSecrets = (id) =>
  User.scope('withSecrets').findByPk(id, { include: [roleInclude] });

const emailExists = async (email, excludeId = null) => {
  const where = { email: String(email || '').trim().toLowerCase() };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  const count = await User.count({ where });
  return count > 0;
};

const create = (payload, options = {}) => User.create(payload, options);

/**
 * Admin customer list: search across name, email and phone with pagination and
 * an order count per customer.
 */
const listCustomers = async ({ search, roleId, isActive, page, limit, sort = 'newest' }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const where = {};
  if (roleId) where.roleId = roleId;
  if (typeof isActive === 'boolean') where.isActive = isActive;

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
    ];
  }

  const order =
    sort === 'oldest'
      ? [['createdAt', 'ASC']]
      : sort === 'name'
        ? [['name', 'ASC']]
        : [['createdAt', 'DESC']];

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [roleInclude],
    order,
    limit: take,
    offset,
    distinct: true,
  });

  return { rows, count, page: currentPage, limit: take };
};

const countOrdersByUser = async (userId) => Order.count({ where: { userId } });

const update = async (user, payload) => {
  user.set(payload);
  await user.save();
  return user;
};

module.exports = {
  findById,
  findByEmail,
  findByIdWithSecrets,
  emailExists,
  create,
  listCustomers,
  countOrdersByUser,
  update,
};
