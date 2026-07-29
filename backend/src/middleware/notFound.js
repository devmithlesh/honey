'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Catch-all for unmatched routes.
 *
 * Registered with `app.use(notFound)` and no path string: Express 5 uses
 * path-to-regexp v8, where a bare `'*'` is no longer a valid route pattern.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
};

module.exports = notFound;
