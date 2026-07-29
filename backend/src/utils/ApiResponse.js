'use strict';

const HTTP_STATUS = require('../constants/httpStatus');

/**
 * The single place where the success envelope is produced. Every controller
 * responds through these helpers so the shape stays identical across the API:
 *
 *   { "success": true, "message": "...", "data": {} }
 *   { "success": true, "message": "...", "data": [], "meta": { pagination } }
 */
const send = (res, statusCode, message, data = null, meta = undefined) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

module.exports = {
  send,
  ok: (res, message = 'Request successful', data = null, meta) =>
    send(res, HTTP_STATUS.OK, message, data, meta),
  created: (res, message = 'Resource created successfully', data = null) =>
    send(res, HTTP_STATUS.CREATED, message, data),
  noContent: (res) => res.status(HTTP_STATUS.NO_CONTENT).send(),
};
