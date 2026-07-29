'use strict';

const { Op } = require('sequelize');

const { Notification } = require('../models');
const { buildPagination } = require('../utils/pagination');

/**
 * `userId: null` addresses the admin console rather than a customer, so the
 * admin feed reads NULL rows and a customer reads their own.
 */
const create = (payload, options = {}) => Notification.create(payload, options);

const listForUser = async ({ userId, page, limit }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const { rows, count } = await Notification.findAndCountAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: take,
    offset,
  });

  return { rows, count, page: currentPage, limit: take };
};

const listForAdmin = async ({ page, limit }) => {
  const { limit: take, offset, page: currentPage } = buildPagination({ page, limit });

  const { rows, count } = await Notification.findAndCountAll({
    where: { userId: null },
    order: [['createdAt', 'DESC']],
    limit: take,
    offset,
  });

  return { rows, count, page: currentPage, limit: take };
};

const countUnread = (userId = null) =>
  Notification.count({ where: { userId, isRead: false } });

const markRead = (id, userId = null) =>
  Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { id, userId, isRead: false } }
  );

const markAllRead = (userId = null) =>
  Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );

const purgeOlderThan = (date) =>
  Notification.destroy({ where: { createdAt: { [Op.lt]: date }, isRead: true } });

module.exports = {
  create,
  listForUser,
  listForAdmin,
  countUnread,
  markRead,
  markAllRead,
  purgeOlderThan,
};
