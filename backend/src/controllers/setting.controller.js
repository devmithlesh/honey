'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const settingService = require('../services/setting.service');
const uploadService = require('../services/upload.service');

/** Only `is_public` settings — safe to render in the storefront. */
const getPublic = asyncHandler(async (req, res) => {
  const settings = await settingService.getPublicSettings();
  return ApiResponse.ok(res, 'Settings loaded', settings);
});

const getAll = asyncHandler(async (req, res) => {
  const settings = await settingService.getAllSettings();
  return ApiResponse.ok(res, 'Settings loaded', settings);
});

const update = asyncHandler(async (req, res) => {
  const settings = await settingService.updateSettings(req.body);
  return ApiResponse.ok(res, 'Settings updated successfully', settings);
});

/**
 * Image settings (logo, UPI QR) upload the file and then store the resulting
 * URL under the given key, so the settings table stays a plain key/value store.
 */
const uploadImageSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const image = await uploadService.uploadImage(req.file, 'settings');
  const settings = await settingService.updateSettings({ [key]: image.url });
  return ApiResponse.ok(res, 'Image uploaded successfully', settings);
});

module.exports = { getPublic, getAll, update, uploadImageSetting };
