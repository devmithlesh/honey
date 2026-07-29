'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const orderService = require('../services/order.service');
const { buildPaginationMeta } = require('../utils/pagination');

const readQuery = (req) => req.validatedQuery || req.query;

/** Checkout preview. Writes nothing — the client renders these totals. */
const quote = asyncHandler(async (req, res) => {
  const summary = await orderService.quote(req.body, req.user?.id || null);
  return ApiResponse.ok(res, 'Order summary calculated', summary);
});

const create = asyncHandler(async (req, res) => {
  const order = await orderService.create(req.body, req.user || null);
  return ApiResponse.created(res, 'Order placed successfully', order);
});

/** Guests reach their order by its unguessable number; owners by session. */
const getByOrderNumber = asyncHandler(async (req, res) => {
  const order = await orderService.getByOrderNumber(req.params.orderNumber, req.user || null);
  return ApiResponse.ok(res, 'Order loaded', order);
});

const listMine = asyncHandler(async (req, res) => {
  const { rows, count, page, limit } = await orderService.listForUser(req.user.id, readQuery(req));
  return ApiResponse.ok(
    res,
    'Orders loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const cancelMine = asyncHandler(async (req, res) => {
  const order = await orderService.cancelByCustomer(
    req.params.orderNumber,
    req.user,
    req.body?.reason
  );
  return ApiResponse.ok(res, 'Order cancelled successfully', order);
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const adminList = asyncHandler(async (req, res) => {
  const { rows, count, page, limit } = await orderService.listForAdmin(readQuery(req));
  return ApiResponse.ok(
    res,
    'Orders loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const adminGet = asyncHandler(async (req, res) => {
  const order = await orderService.getById(req.params.id);
  return ApiResponse.ok(res, 'Order loaded', order);
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body, req.user);
  return ApiResponse.ok(res, `Order marked as ${req.body.status}`, order);
});

const updatePayment = asyncHandler(async (req, res) => {
  const order = await orderService.updatePayment(req.params.id, req.body, req.user);
  return ApiResponse.ok(res, 'Payment updated successfully', order);
});

const invoice = asyncHandler(async (req, res) => {
  const data = await orderService.buildInvoice(req.params.id);
  return ApiResponse.ok(res, 'Invoice generated', data);
});

module.exports = {
  quote,
  create,
  getByOrderNumber,
  listMine,
  cancelMine,
  adminList,
  adminGet,
  updateStatus,
  updatePayment,
  invoice,
};
