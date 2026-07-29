'use strict';

const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');
const HTTP_STATUS = require('../constants/httpStatus');

const buildHandler = (message) => (req, res) =>
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message,
    errors: [],
  });

const baseOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Rate limiting is a availability guard, not a correctness guard; skipping it
  // in tests keeps suites deterministic.
  skip: () => env.isTest,
};

/**
 * Broad limiter applied to the whole API surface.
 */
const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.security.rateLimitWindowMs,
  limit: env.security.rateLimitMax,
  handler: buildHandler('Too many requests, please try again later'),
});

/**
 * Strict limiter for credential-handling endpoints (login, register, password
 * reset). Counts per IP + submitted email so one attacker cannot lock out an
 * account by spraying requests at it from a shared NAT address.
 */
const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.security.rateLimitWindowMs,
  limit: env.security.authRateLimitMax,
  // `ipKeyGenerator` normalises IPv6 addresses to a /56 prefix; using `req.ip`
  // raw in a custom key generator is rejected by express-rate-limit v8.
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
  handler: buildHandler('Too many attempts, please try again later'),
});

module.exports = { apiLimiter, authLimiter };
