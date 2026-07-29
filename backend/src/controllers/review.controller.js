'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const reviewService = require('../services/review.service');
const { buildPaginationMeta } = require('../utils/pagination');

const readQuery = (req) => req.validatedQuery || req.query;

const listForProduct = asyncHandler(async (req, res) => {
  const { rows, count, page, limit, breakdown } = await reviewService.listForProduct(
    req.params.slug,
    readQuery(req)
  );

  return ApiResponse.ok(res, 'Reviews loaded', rows, {
    ...buildPaginationMeta({ totalItems: count, page, limit }),
    breakdown,
  });
});

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.create(req.params.slug, req.user.id, req.body);
  return ApiResponse.created(
    res,
    'Thank you! Your review will appear once it has been approved.',
    review
  );
});

const adminList = asyncHandler(async (req, res) => {
  const { rows, count, page, limit } = await reviewService.listForAdmin(readQuery(req));
  return ApiResponse.ok(
    res,
    'Reviews loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const setStatus = asyncHandler(async (req, res) => {
  const review = await reviewService.setStatus(req.params.id, req.body);
  return ApiResponse.ok(res, `Review ${req.body.status}`, review);
});

const remove = asyncHandler(async (req, res) => {
  await reviewService.remove(req.params.id);
  return ApiResponse.ok(res, 'Review deleted successfully', null);
});

module.exports = { listForProduct, create, adminList, setStatus, remove };
