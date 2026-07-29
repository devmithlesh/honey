'use strict';

const multer = require('multer');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

/**
 * Files are buffered in memory and streamed straight to Cloudinary, so nothing
 * touches the server's disk — important on ephemeral hosts, and it removes a
 * whole class of path-traversal and leftover-file problems.
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      ApiError.badRequest(
        `Unsupported image type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }
  return callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.cloudinary.maxFileSizeBytes,
    files: env.cloudinary.maxFilesPerUpload,
  },
});

/** Single image under the given field name. */
const uploadSingle = (field) => upload.single(field);

/** Up to `MAX_FILES_PER_UPLOAD` images under one field name. */
const uploadMany = (field) => upload.array(field, env.cloudinary.maxFilesPerUpload);

module.exports = { upload, uploadSingle, uploadMany, ALLOWED_MIME_TYPES };
