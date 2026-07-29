'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const categoryService = require('../services/category.service');

const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listPublic();
  return ApiResponse.ok(res, 'Categories loaded', categories);
});

const getBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getBySlug(req.params.slug);
  return ApiResponse.ok(res, 'Category loaded', category);
});

const adminList = asyncHandler(async (req, res) => {
  const categories = await categoryService.listForAdmin();
  return ApiResponse.ok(res, 'Categories loaded', categories);
});

const adminGet = asyncHandler(async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  return ApiResponse.ok(res, 'Category loaded', category);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body, req.file);
  return ApiResponse.created(res, 'Category created successfully', category);
});

const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body, req.file);
  return ApiResponse.ok(res, 'Category updated successfully', category);
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  return ApiResponse.ok(res, 'Category deleted successfully', null);
});

module.exports = { list, getBySlug, adminList, adminGet, create, update, remove };
