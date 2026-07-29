'use strict';

const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const orderRepository = require('../repositories/order.repository');
const wishlistRepository = require('../repositories/wishlist.repository');
const addressRepository = require('../repositories/address.repository');
const uploadService = require('./upload.service');
const { toPublicUser } = require('./auth.service');
const { Role } = require('../models');
const { ROLES } = require('../constants');

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');
  return toPublicUser(user);
};

const updateProfile = async (userId, payload) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    if (await userRepository.emailExists(payload.email, user.id)) {
      throw ApiError.conflict('This email is already in use', [
        { field: 'email', message: 'Another account already uses this email' },
      ]);
    }
  }

  // Only these fields are writable by the account owner. Role, active flag and
  // password are deliberately not part of this path.
  await userRepository.update(user, {
    name: payload.name ?? user.name,
    email: payload.email ?? user.email,
    phone: payload.phone === undefined ? user.phone : payload.phone,
  });

  return toPublicUser(user);
};

const updateAvatar = async (userId, file) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');

  const image = await uploadService.uploadImage(file, 'avatars');
  const previousPublicId = user.avatarPublicId;

  await userRepository.update(user, {
    avatarUrl: image.url,
    avatarPublicId: image.publicId,
  });

  await uploadService.destroyImage(previousPublicId);
  return toPublicUser(user);
};

/** Everything the customer dashboard landing page needs, in one round-trip. */
const getDashboard = async (userId) => {
  const [summary, recentOrders, wishlistCount, addressCount] = await Promise.all([
    orderRepository.customerSummary(userId),
    orderRepository.list({ userId, page: 1, limit: 5 }),
    wishlistRepository.countForUser(userId),
    addressRepository.countForUser(userId),
  ]);

  return {
    summary: { ...summary, wishlistCount, addressCount },
    recentOrders: recentOrders.rows,
  };
};

// ---------------------------------------------------------------------------
// Admin-facing customer management
// ---------------------------------------------------------------------------

const listCustomers = async (query) => {
  const customerRole = await Role.findOne({ where: { name: ROLES.CUSTOMER } });

  const page = await userRepository.listCustomers({
    ...query,
    roleId: query.roleId || customerRole?.id,
  });

  // Order counts are attached per row rather than joined, so the list query
  // stays a simple paginated SELECT.
  const rows = await Promise.all(
    page.rows.map(async (user) => ({
      ...toPublicUser(user),
      lastLoginAt: user.lastLoginAt,
      orderCount: await userRepository.countOrdersByUser(user.id),
    }))
  );

  return { ...page, rows };
};

const getCustomer = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('Customer not found');

  const [summary, orders, addresses] = await Promise.all([
    orderRepository.customerSummary(user.id),
    orderRepository.list({ userId: user.id, page: 1, limit: 10 }),
    addressRepository.listByUser(user.id),
  ]);

  return {
    customer: { ...toPublicUser(user), lastLoginAt: user.lastLoginAt },
    summary,
    orders: orders.rows,
    addresses,
  };
};

const setCustomerStatus = async (id, isActive, actor) => {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('Customer not found');

  if (String(user.id) === String(actor.id)) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  if (user.role?.name === ROLES.ADMIN) {
    throw ApiError.forbidden('Administrator accounts cannot be deactivated from here');
  }

  await userRepository.update(user, { isActive });

  // Deactivating must also end any live session, not just block new logins.
  if (!isActive) {
    const withSecrets = await userRepository.findByIdWithSecrets(user.id);
    withSecrets.refreshTokenHash = null;
    await withSecrets.save();
  }

  return toPublicUser(user);
};

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  listCustomers,
  getCustomer,
  setCustomerStatus,
};
