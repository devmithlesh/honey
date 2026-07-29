'use strict';

const {
  ValidationError: SequelizeValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ConnectionError,
} = require('sequelize');
const multer = require('multer');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');

const ApiError = require('../utils/ApiError');
const HTTP_STATUS = require('../constants/httpStatus');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Translates library-specific errors into `ApiError` so the response shape is
 * uniform and no driver internals (SQL text, constraint names, stack traces)
 * leak to the client.
 */
const normalise = (err) => {
  if (err instanceof ApiError) return err;

  if (err instanceof UniqueConstraintError) {
    const errors = err.errors.map((item) => ({
      field: item.path,
      message: `${item.path} is already in use`,
    }));
    return ApiError.conflict('Resource already exists', errors);
  }

  if (err instanceof SequelizeValidationError) {
    const errors = err.errors.map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return ApiError.validation('Validation failed', errors);
  }

  if (err instanceof ForeignKeyConstraintError) {
    return ApiError.badRequest('Related record does not exist or is still in use');
  }

  if (err instanceof ConnectionError) {
    logger.error('Database connection error:', err);
    return ApiError.serviceUnavailable('Database is unavailable, please try again shortly');
  }

  if (err instanceof DatabaseError) {
    logger.error('Database error:', err);
    return ApiError.internal();
  }

  if (err instanceof TokenExpiredError) {
    return ApiError.unauthorized('Session expired, please sign in again');
  }

  if (err instanceof JsonWebTokenError) {
    return ApiError.unauthorized('Invalid authentication token');
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiError.payloadTooLarge('Uploaded file exceeds the maximum allowed size');
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiError.badRequest('Too many files uploaded, or an unexpected field was received');
    }
    return ApiError.badRequest(`File upload failed: ${err.message}`);
  }

  // `express.json()` rejects malformed bodies with a SyntaxError carrying a status.
  if (err instanceof SyntaxError && 'body' in err) {
    return ApiError.badRequest('Request body is not valid JSON');
  }

  return new ApiError(
    err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err.message || 'Something went wrong',
    [],
    { isOperational: false, cause: err }
  );
};

/**
 * Terminal error middleware. Express 5 identifies it by its four parameters,
 * so `next` must stay in the signature even though it is unused.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const error = normalise(err);
  const isServerError = error.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR;

  if (isServerError) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else if (env.isDevelopment) {
    logger.debug(`${req.method} ${req.originalUrl} -> ${error.statusCode} ${error.message}`);
  }

  // Never surface the raw message of an unexpected failure in production.
  const message =
    isServerError && env.isProduction ? 'Something went wrong' : error.message;

  const body = {
    success: false,
    message,
    errors: error.errors,
  };

  if (!env.isProduction && isServerError) {
    body.stack = err.stack;
  }

  return res.status(error.statusCode).json(body);
};

module.exports = errorHandler;
