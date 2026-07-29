'use strict';

const HTTP_STATUS = require('../constants/httpStatus');

/**
 * Error type carrying an HTTP status and optional field-level details.
 *
 * Only errors marked `isOperational` are safe to surface verbatim to clients;
 * the global error handler hides the message of anything else in production.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = [], options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : [errors];
    this.isOperational = options.isOperational !== false;
    if (options.cause) this.cause = options.cause;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static validation(message = 'Validation failed', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static unauthorized(message = 'Authentication required', errors = []) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  static forbidden(message = 'You do not have permission to perform this action', errors = []) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  static notFound(message = 'Resource not found', errors = []) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  static conflict(message = 'Resource already exists', errors = []) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later', errors = []) {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, errors);
  }

  static payloadTooLarge(message = 'Uploaded file is too large', errors = []) {
    return new ApiError(HTTP_STATUS.PAYLOAD_TOO_LARGE, message, errors);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', errors = []) {
    return new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, message, errors);
  }

  static internal(message = 'Something went wrong', errors = []) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors, {
      isOperational: false,
    });
  }
}

module.exports = ApiError;
