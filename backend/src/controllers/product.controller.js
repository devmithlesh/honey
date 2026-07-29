'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const productService = require('../services/product.service');
const { buildPaginationMeta } = require('../utils/pagination');

/** Query params come from `req.validatedQuery`; Express 5 makes `req.query` read-only. */
const readQuery = (req) => req.validatedQuery || req.query;

const list = asyncHandler(async (req, res) => {
  const query = readQuery(req);
  const { rows, count, page, limit } = await productService.listPublic({
    ...query,
    categorySlug: query.category || undefined,
  });

  return ApiResponse.ok(
    res,
    'Products loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const featured = asyncHandler(async (req, res) => {
  const { rows } = await productService.listPublic({
    featured: true,
    sort: 'popular',
    page: 1,
    limit: readQuery(req).limit || 8,
  });

  return ApiResponse.ok(res, 'Featured products loaded', rows);
});

const detail = asyncHandler(async (req, res) => {
  const data = await productService.getDetail(req.params.slug);
  return ApiResponse.ok(res, 'Product loaded', data);
});

const related = asyncHandler(async (req, res) => {
  const products = await productService.getRelated(req.params.slug);
  return ApiResponse.ok(res, 'Related products loaded', products);
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const adminList = asyncHandler(async (req, res) => {
  const query = readQuery(req);
  const { rows, count, page, limit } = await productService.listForAdmin({
    ...query,
    categorySlug: query.category || undefined,
  });

  return ApiResponse.ok(
    res,
    'Products loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const adminGet = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  return ApiResponse.ok(res, 'Product loaded', product);
});

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body, req.files || []);
  return ApiResponse.created(res, 'Product created successfully', product);
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body, req.files || []);
  return ApiResponse.ok(res, 'Product updated successfully', product);
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id);
  return ApiResponse.ok(res, 'Product deleted successfully', null);
});

const addImages = asyncHandler(async (req, res) => {
  const product = await productService.addImages(req.params.id, req.files || []);
  return ApiResponse.created(res, 'Images uploaded successfully', product);
});

const removeImage = asyncHandler(async (req, res) => {
  const product = await productService.removeImage(req.params.id, req.params.imageId);
  return ApiResponse.ok(res, 'Image removed successfully', product);
});

const setPrimaryImage = asyncHandler(async (req, res) => {
  const product = await productService.setPrimaryImage(req.params.id, req.params.imageId);
  return ApiResponse.ok(res, 'Primary image updated', product);
});

module.exports = {
  list,
  featured,
  detail,
  related,
  adminList,
  adminGet,
  create,
  update,
  remove,
  addImages,
  removeImage,
  setPrimaryImage,
};
