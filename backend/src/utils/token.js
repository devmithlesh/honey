'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const env = require('../config/env');

/**
 * Token kinds are namespaced with a `type` claim so a refresh token can never
 * be replayed as an access token, even if the secrets were ever mixed up.
 */
const TOKEN_TYPE = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET: 'reset',
});

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role?.name || user.roleName,
      type: TOKEN_TYPE.ACCESS,
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: String(user.id), type: TOKEN_TYPE.REFRESH },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );

const signResetToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      type: TOKEN_TYPE.RESET,
      // Binding the current hash invalidates outstanding reset links the moment
      // the password changes, so a leaked link cannot be reused.
      fingerprint: fingerprintPassword(user.password),
    },
    env.jwt.resetSecret,
    { expiresIn: env.jwt.resetExpiresIn }
  );

const verify = (token, secret, expectedType) => {
  const payload = jwt.verify(token, secret);
  if (payload.type !== expectedType) {
    throw new jwt.JsonWebTokenError('Token type mismatch');
  }
  return payload;
};

const verifyAccessToken = (token) => verify(token, env.jwt.accessSecret, TOKEN_TYPE.ACCESS);
const verifyRefreshToken = (token) => verify(token, env.jwt.refreshSecret, TOKEN_TYPE.REFRESH);
const verifyResetToken = (token) => verify(token, env.jwt.resetSecret, TOKEN_TYPE.RESET);

/**
 * Refresh tokens are stored as a SHA-256 digest, never in plaintext: a database
 * leak then yields nothing that can be replayed against the API.
 */
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/** Short, non-reversible marker of a password hash used inside reset tokens. */
const fingerprintPassword = (passwordHash) =>
  crypto.createHash('sha256').update(String(passwordHash || '')).digest('hex').slice(0, 16);

module.exports = {
  TOKEN_TYPE,
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
  hashToken,
  fingerprintPassword,
};
