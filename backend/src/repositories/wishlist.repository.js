'use strict';

const { Wishlist, Product } = require('../models');
const { imageInclude, categoryInclude } = require('./product.repository');

const productInclude = {
  model: Product,
  as: 'product',
  include: [imageInclude, categoryInclude],
};

const listByUser = (userId) =>
  Wishlist.findAll({
    where: { userId },
    include: [productInclude],
    order: [['createdAt', 'DESC']],
  });

const findEntry = (userId, productId) => Wishlist.findOne({ where: { userId, productId } });

const create = (userId, productId) => Wishlist.create({ userId, productId });

const destroy = (entry) => entry.destroy();

const countForUser = (userId) => Wishlist.count({ where: { userId } });

const listProductIds = async (userId) => {
  const rows = await Wishlist.findAll({ where: { userId }, attributes: ['productId'], raw: true });
  return rows.map((row) => String(row.productId));
};

module.exports = { listByUser, findEntry, create, destroy, countForUser, listProductIds };
