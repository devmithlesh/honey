'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/user.service');
const addressService = require('../services/address.service');
const wishlistService = require('../services/wishlist.service');
const { buildPaginationMeta } = require('../utils/pagination');

const readQuery = (req) => req.validatedQuery || req.query;

// ----- Profile -------------------------------------------------------------

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  return ApiResponse.ok(res, 'Profile loaded', { user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return ApiResponse.ok(res, 'Profile updated successfully', { user });
});

const updateAvatar = asyncHandler(async (req, res) => {
  const user = await userService.updateAvatar(req.user.id, req.file);
  return ApiResponse.ok(res, 'Profile photo updated', { user });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await userService.getDashboard(req.user.id);
  return ApiResponse.ok(res, 'Dashboard loaded', data);
});

// ----- Addresses -----------------------------------------------------------

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.list(req.user.id);
  return ApiResponse.ok(res, 'Addresses loaded', addresses);
});

const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.create(req.user.id, req.body);
  return ApiResponse.created(res, 'Address saved successfully', address);
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.update(req.params.id, req.user.id, req.body);
  return ApiResponse.ok(res, 'Address updated successfully', address);
});

const removeAddress = asyncHandler(async (req, res) => {
  await addressService.remove(req.params.id, req.user.id);
  return ApiResponse.ok(res, 'Address deleted successfully', null);
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefault(req.params.id, req.user.id);
  return ApiResponse.ok(res, 'Default address updated', address);
});

// ----- Wishlist ------------------------------------------------------------

const listWishlist = asyncHandler(async (req, res) => {
  const products = await wishlistService.list(req.user.id);
  return ApiResponse.ok(res, 'Wishlist loaded', products);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const products = await wishlistService.add(req.user.id, req.body.productId);
  return ApiResponse.created(res, 'Saved to your wishlist', products);
});

const toggleWishlist = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggle(req.user.id, req.body.productId);
  return ApiResponse.ok(
    res,
    result.saved ? 'Saved to your wishlist' : 'Removed from your wishlist',
    result
  );
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const products = await wishlistService.remove(req.user.id, req.params.productId);
  return ApiResponse.ok(res, 'Removed from your wishlist', products);
});

// ----- Admin: customers ----------------------------------------------------

const adminListCustomers = asyncHandler(async (req, res) => {
  const { rows, count, page, limit } = await userService.listCustomers(readQuery(req));
  return ApiResponse.ok(
    res,
    'Customers loaded',
    rows,
    buildPaginationMeta({ totalItems: count, page, limit })
  );
});

const adminGetCustomer = asyncHandler(async (req, res) => {
  const data = await userService.getCustomer(req.params.id);
  return ApiResponse.ok(res, 'Customer loaded', data);
});

const adminSetCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await userService.setCustomerStatus(req.params.id, req.body.isActive, req.user);
  return ApiResponse.ok(
    res,
    req.body.isActive ? 'Customer reactivated' : 'Customer deactivated',
    customer
  );
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  getDashboard,
  listAddresses,
  createAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress,
  listWishlist,
  addToWishlist,
  toggleWishlist,
  removeFromWishlist,
  adminListCustomers,
  adminGetCustomer,
  adminSetCustomerStatus,
};
