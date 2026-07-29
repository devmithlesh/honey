'use strict';

const { PAGINATION } = require('../constants');

/**
 * Normalises `page` / `limit` query values into Sequelize `limit` + `offset`.
 * Values are already coerced by the Joi query validator, but this stays
 * defensive because repositories may be called from services directly.
 */
const buildPagination = ({ page, limit } = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || PAGINATION.DEFAULT_PAGE, 1);
  const requestedLimit = Number.parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT;
  const safeLimit = Math.min(Math.max(requestedLimit, 1), PAGINATION.MAX_LIMIT);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

/**
 * Builds the `meta.pagination` block returned alongside every list endpoint.
 */
const buildPaginationMeta = ({ totalItems, page, limit }) => {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    },
  };
};

module.exports = { buildPagination, buildPaginationMeta };
