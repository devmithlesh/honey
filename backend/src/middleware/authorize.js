'use strict';

const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');

/**
 * Role gate. Must be mounted after `authenticate`, which is what puts the
 * resolved user (with its eager-loaded role) on the request.
 */
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const roleName = req.user.role?.name;
    if (!allowedRoles.includes(roleName)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    return next();
  };

const requireAdmin = authorize(ROLES.ADMIN);

module.exports = { authorize, requireAdmin };
