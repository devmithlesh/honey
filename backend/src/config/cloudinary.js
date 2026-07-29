'use strict';

const { v2: cloudinary } = require('cloudinary');

const env = require('./env');
const logger = require('../utils/logger');

/**
 * Cloudinary is optional in local development: without credentials the upload
 * service degrades to a clear error instead of crashing the whole API at boot.
 */
if (env.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  logger.info(`Cloudinary configured (cloud: ${env.cloudinary.cloudName})`);
} else {
  logger.warn('Cloudinary is not configured — image uploads will be rejected');
}

module.exports = cloudinary;
