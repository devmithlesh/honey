'use strict';

const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');
const { User, Role } = require('../models');

const readBearerToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
};

/**
 * Resolves the caller from the access token and attaches `req.user`.
 *
 * The user row is re-read on every request rather than trusted from the token
 * claims, so a deactivated account or a role change takes effect immediately
 * instead of lingering until the token expires.
 */
const loadUser = async (token) => {
  const payload = verifyAccessToken(token);

  const user = await User.findByPk(payload.sub, {
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
  });

  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  // A password change invalidates every token issued before it.
  if (user.passwordChangedAt && payload.iat) {
    const changedAtSeconds = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
    if (payload.iat < changedAtSeconds) {
      throw ApiError.unauthorized('Password was changed, please sign in again');
    }
  }

  return user;
};

/** Hard gate: rejects the request when no valid access token is present. */
const authenticate = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  req.user = await loadUser(token);
  return next();
});

/**
 * Soft gate for endpoints that serve both guests and signed-in customers
 * (checkout, order lookup). An invalid token is treated as "no session" rather
 * than an error, so a stale token never blocks a guest purchase.
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) return next();

  try {
    req.user = await loadUser(token);
  } catch {
    req.user = undefined;
  }

  return next();
});

module.exports = { authenticate, optionalAuthenticate };
