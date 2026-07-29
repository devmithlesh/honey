'use strict';

const express = require('express');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const couponRoutes = require('./coupon.routes');
const settingRoutes = require('./setting.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

/**
 * API v1 route table — the single index of the public API surface.
 *
 * `/admin` is mounted last and applies its own authentication and role guard to
 * everything beneath it.
 */
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/settings', settingRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
