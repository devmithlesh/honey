'use strict';

const ApiError = require('../utils/ApiError');

const SOURCES = ['body', 'query', 'params'];

/**
 * Builds a middleware that validates the request against a Joi schema map,
 * e.g. `validate({ body: createProductSchema, query: listQuerySchema })`.
 *
 * All violations across every source are reported together so the client can
 * highlight each bad field in one pass.
 *
 * Note for Express 5: `req.query` is a getter with no setter, so the sanitised
 * value is exposed on `req.validated.query` rather than reassigned in place.
 */
const validate = (schemas) => (req, res, next) => {
  const errors = [];
  const validated = {};

  for (const source of SOURCES) {
    const schema = schemas[source];
    if (!schema) continue;

    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      for (const detail of error.details) {
        errors.push({
          field: detail.path.join('.') || source,
          message: detail.message.replace(/"/g, ''),
        });
      }
      continue;
    }

    validated[source] = value;

    // `body` and `params` are plain writable properties; `query` is not.
    if (source !== 'query') {
      req[source] = value;
    }
  }

  if (errors.length > 0) {
    return next(ApiError.validation('Validation failed', errors));
  }

  req.validated = { ...req.validated, ...validated };
  // Convenience alias so handlers can read sanitised query params directly.
  if (validated.query) req.validatedQuery = validated.query;

  return next();
};

module.exports = validate;
