'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const userRepository = require('../repositories/user.repository');
const mailService = require('./mail.service');
const { Role } = require('../models');
const { ROLES } = require('../constants');
const {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyRefreshToken,
  verifyResetToken,
  hashToken,
  fingerprintPassword,
} = require('../utils/token');

const getRoleByName = async (name) => {
  const role = await Role.findOne({ where: { name } });
  if (!role) {
    // The roles table is seeded; a miss means the database was not migrated.
    throw ApiError.internal(`Role "${name}" is missing. Run the database seeders.`);
  }
  return role;
};

/** Shape returned to the client for the signed-in user. */
const toPublicUser = (user) => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  role: user.role?.name || null,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

/**
 * Issues a fresh token pair and stores the hash of the refresh token, which
 * both enables server-side revocation and rotates the token on every refresh.
 */
const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

const register = async ({ name, email, phone, password }) => {
  if (await userRepository.emailExists(email)) {
    throw ApiError.conflict('An account with this email already exists', [
      { field: 'email', message: 'This email is already registered' },
    ]);
  }

  const customerRole = await getRoleByName(ROLES.CUSTOMER);

  // Self-registration always creates a customer. Administrators are seeded or
  // promoted deliberately — the role can never be chosen by the client.
  const created = await userRepository.create({
    roleId: customerRole.id,
    name,
    email,
    phone: phone || null,
    password,
  });

  const user = await userRepository.findByIdWithSecrets(created.id);
  const tokens = await issueTokens(user);

  return { user: toPublicUser(user), ...tokens };
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email, { withSecrets: true });

  // One generic message for both branches, so the endpoint cannot be used to
  // enumerate which addresses have accounts.
  const invalid = ApiError.unauthorized('Invalid email or password');
  if (!user) throw invalid;

  const passwordMatches = await user.verifyPassword(password);
  if (!passwordMatches) throw invalid;

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Please contact support.');
  }

  user.lastLoginAt = new Date();
  const tokens = await issueTokens(user);

  return { user: toPublicUser(user), ...tokens };
};

/**
 * Refresh-token rotation: the presented token must match the stored hash, and
 * a new pair is issued on every call. A replayed token fails the hash check.
 */
const refresh = async (refreshToken) => {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token is missing');

  const payload = verifyRefreshToken(refreshToken);
  const user = await userRepository.findByIdWithSecrets(payload.sub);

  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Session is no longer valid, please sign in again');
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    // Token reuse: revoke the whole session rather than silently reissuing.
    user.refreshTokenHash = null;
    await user.save();
    throw ApiError.unauthorized('Session is no longer valid, please sign in again');
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
};

const logout = async (userId) => {
  if (!userId) return;
  const user = await userRepository.findByIdWithSecrets(userId);
  if (!user) return;
  user.refreshTokenHash = null;
  await user.save();
};

/**
 * Always resolves the same way whether or not the address exists — otherwise
 * the endpoint becomes an account-enumeration oracle.
 */
const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email, { withSecrets: true });

  if (user && user.isActive) {
    const resetToken = signResetToken(user);
    try {
      await mailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
    }
    return { emailSent: true };
  }

  return { emailSent: true };
};

const resetPassword = async ({ token, password }) => {
  const payload = verifyResetToken(token);
  const user = await userRepository.findByIdWithSecrets(payload.sub);

  if (!user) throw ApiError.badRequest('This reset link is no longer valid');

  // The token embeds a fingerprint of the password it was issued against, so a
  // link cannot be used twice or after the password changed by another route.
  if (payload.fingerprint !== fingerprintPassword(user.password)) {
    throw ApiError.badRequest('This reset link has already been used');
  }

  user.password = password;
  // Every existing session dies with the password change.
  user.refreshTokenHash = null;
  await user.save();

  return { reset: true };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findByIdWithSecrets(userId);
  if (!user) throw ApiError.notFound('Account not found');

  const matches = await user.verifyPassword(currentPassword);
  if (!matches) {
    throw ApiError.badRequest('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest('The new password must be different from the current one', [
      { field: 'newPassword', message: 'Choose a password you have not used here before' },
    ]);
  }

  user.password = newPassword;
  await user.save();

  // The caller is issued a fresh pair so their own session survives the change.
  const tokens = await issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
};

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw ApiError.notFound('Account not found');
  return toPublicUser(user);
};

module.exports = {
  toPublicUser,
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
};
