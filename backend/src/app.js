'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const ApiError = require('./utils/ApiError');
const { apiLimiter } = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

/**
 * Behind a reverse proxy (nginx, Render, Railway) the client IP arrives in
 * `X-Forwarded-For`. Trusting exactly one hop keeps `req.ip` accurate for rate
 * limiting without letting clients spoof the header.
 */
app.set('trust proxy', env.isProduction ? 1 : false);
app.disable('x-powered-by');

app.use(
  helmet({
    // The API serves JSON and Cloudinary-hosted images only; a restrictive
    // default CSP is correct here since no first-party HTML is rendered.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.isProduction ? [] : null,
      },
    },
    hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

/**
 * Credentialed CORS: the browser sends the refresh-token cookie, so the origin
 * must be echoed explicitly — a wildcard is rejected by the browser when
 * `credentials: true`.
 */
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin, curl, and server-to-server calls send no Origin header.
      if (!origin) return callback(null, true);
      const normalised = origin.replace(/\/+$/, '');
      if (env.corsOrigins.includes(normalised)) return callback(null, true);
      return callback(ApiError.forbidden(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['RateLimit', 'RateLimit-Policy'],
    maxAge: 86400,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression());

if (!env.isTest) {
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

app.use(env.apiPrefix, apiLimiter, routes);

// Unmatched route -> 404 -> centralised error handler. Both are registered
// without a path: Express 5 no longer accepts a bare '*' pattern.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
