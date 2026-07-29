'use strict';

/**
 * Wraps an async route handler so a rejected promise reaches `next()`.
 *
 * Express 5 already forwards rejections from async handlers, but wrapping is
 * kept explicit: it also covers handlers that return a promise without being
 * declared `async`, and it documents intent at each call site.
 */
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
