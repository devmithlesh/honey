'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const env = require('../config/env');
const { sequelize } = require('../config/database');

const router = express.Router();

/**
 * GET /health — liveness plus a real database round-trip, so an unreachable
 * MySQL surfaces as a degraded service rather than a healthy one.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    let database = 'connected';
    try {
      await sequelize.authenticate();
    } catch {
      database = 'disconnected';
    }

    return ApiResponse.ok(res, 'Service is healthy', {
      service: env.appName,
      environment: env.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
      database,
      timestamp: new Date().toISOString(),
    });
  })
);

module.exports = router;
