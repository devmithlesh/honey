'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const couponService = require('../services/coupon.service');
const { buildPaginationMeta } = require('../utils/pagination');

const readQuery = (req) => req.validatedQuery || req.query;

/** Storefront check — confirms a code applies to the current cart subtotal. */
const validateCode = asyncHandler(async (req, res) => {
  const result = await couponService.validateForCart(
    req.body.code,
    req.body.subtotal,
    req.user?.id || null
  );
  return ApiResponse.ok(res, 'Coupon applied', result);
});

const adminList = asyncHandler(async (req, res) => {
  const { rows, count, page, limit } = await couponService.list(readQuery(req));
  return ApiResponse.ok(
    res,
    'Coupons loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const adminGet = asyncHandler(async (req, res) => {
  const coupon = await couponService.getById(req.params.id);
  return ApiResponse.ok(res, 'Coupon loaded', coupon);
});

const create = asyncHandler(async (req, res) => {
  const coupon = await couponService.create(req.body);
  return ApiResponse.created(res, 'Coupon created successfully', coupon);
});

const update = asyncHandler(async (req, res) => {
  const coupon = await couponService.update(req.params.id, req.body);
  return ApiResponse.ok(res, 'Coupon updated successfully', coupon);
});

const remove = asyncHandler(async (req, res) => {
  await couponService.remove(req.params.id);
  return ApiResponse.ok(res, 'Coupon deleted successfully', null);
});

module.exports = { validateCode, adminList, adminGet, create, update, remove };
