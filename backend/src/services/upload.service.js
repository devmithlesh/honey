'use strict';

const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const assertConfigured = () => {
  if (!env.cloudinary.isConfigured) {
    throw ApiError.serviceUnavailable(
      'Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
    );
  }
};

/**
 * Streams one in-memory file to Cloudinary.
 *
 * `quality: auto` and `fetch_format: auto` let Cloudinary serve AVIF/WebP to
 * browsers that accept them, and the size cap keeps a 12 MP phone photo from
 * being delivered as a product thumbnail.
 */
const uploadBuffer = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.cloudinary.folder}/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(file.buffer);
  });

const uploadImage = async (file, folder = 'misc') => {
  assertConfigured();
  if (!file?.buffer) throw ApiError.badRequest('No image file was received');
  return uploadBuffer(file, folder);
};

const uploadImages = async (files = [], folder = 'misc') => {
  assertConfigured();
  if (files.length === 0) throw ApiError.badRequest('No image files were received');
  return Promise.all(files.map((file) => uploadBuffer(file, folder)));
};

/**
 * Best-effort removal. A failed delete must never fail the request that
 * replaced the image — the new URL is already persisted — so it is logged and
 * swallowed instead of thrown.
 */
const destroyImage = async (publicId) => {
  if (!publicId || !env.cloudinary.isConfigured) return false;

  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    logger.warn(`Failed to delete Cloudinary asset "${publicId}": ${error.message}`);
    return false;
  }
};

const destroyImages = async (publicIds = []) => {
  const results = await Promise.all(publicIds.filter(Boolean).map(destroyImage));
  return results.filter(Boolean).length;
};

module.exports = { uploadImage, uploadImages, destroyImage, destroyImages };
