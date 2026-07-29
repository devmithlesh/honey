'use strict';

const ApiError = require('../utils/ApiError');
const wishlistRepository = require('../repositories/wishlist.repository');
const productRepository = require('../repositories/product.repository');

const list = async (userId) => {
  const entries = await wishlistRepository.listByUser(userId);
  // The join row itself is an implementation detail; the client wants products.
  return entries.filter((entry) => entry.product).map((entry) => entry.product);
};

const listProductIds = (userId) => wishlistRepository.listProductIds(userId);

const add = async (userId, productId) => {
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await wishlistRepository.findEntry(userId, productId);
  // Idempotent: adding twice is not an error, the item is simply already saved.
  if (!existing) await wishlistRepository.create(userId, productId);

  return list(userId);
};

const remove = async (userId, productId) => {
  const entry = await wishlistRepository.findEntry(userId, productId);
  if (!entry) throw ApiError.notFound('This product is not in your wishlist');

  await wishlistRepository.destroy(entry);
  return list(userId);
};

const toggle = async (userId, productId) => {
  const entry = await wishlistRepository.findEntry(userId, productId);

  if (entry) {
    await wishlistRepository.destroy(entry);
    return { saved: false, products: await list(userId) };
  }

  await add(userId, productId);
  return { saved: true, products: await list(userId) };
};

const count = (userId) => wishlistRepository.countForUser(userId);

module.exports = { list, listProductIds, add, remove, toggle, count };
