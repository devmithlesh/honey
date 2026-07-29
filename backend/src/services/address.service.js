'use strict';

const ApiError = require('../utils/ApiError');
const addressRepository = require('../repositories/address.repository');

const MAX_ADDRESSES_PER_USER = 10;

const list = (userId) => addressRepository.listByUser(userId);

const getById = async (id, userId) => {
  const address = await addressRepository.findByIdForUser(id, userId);
  if (!address) throw ApiError.notFound('Address not found');
  return address;
};

const create = async (userId, payload) => {
  const existingCount = await addressRepository.countForUser(userId);

  if (existingCount >= MAX_ADDRESSES_PER_USER) {
    throw ApiError.badRequest(
      `You can save up to ${MAX_ADDRESSES_PER_USER} addresses. Delete one to add another.`
    );
  }

  // The first address a customer saves becomes their default automatically.
  const isDefault = payload.isDefault || existingCount === 0;

  const address = await addressRepository.create({ ...payload, userId, isDefault });

  if (isDefault) {
    await addressRepository.clearDefaultForUser(userId, address.id);
  }

  return address;
};

const update = async (id, userId, payload) => {
  const address = await getById(id, userId);
  await addressRepository.update(address, payload);

  if (payload.isDefault) {
    await addressRepository.clearDefaultForUser(userId, address.id);
  }

  return address;
};

const remove = async (id, userId) => {
  const address = await getById(id, userId);
  const wasDefault = address.isDefault;

  await addressRepository.destroy(address);

  // Promote another address so the customer always has a default to fall back
  // on at checkout.
  if (wasDefault) {
    const remaining = await addressRepository.listByUser(userId);
    if (remaining.length > 0) {
      remaining[0].isDefault = true;
      await remaining[0].save();
    }
  }

  return { deleted: true };
};

const setDefault = async (id, userId) => {
  const address = await getById(id, userId);

  address.isDefault = true;
  await address.save();
  await addressRepository.clearDefaultForUser(userId, address.id);

  return address;
};

module.exports = { MAX_ADDRESSES_PER_USER, list, getById, create, update, remove, setDefault };
