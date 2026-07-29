'use strict';

const express = require('express');

const couponController = require('../controllers/coupon.controller');
const validate = require('../middleware/validate');
const { optionalAuthenticate } = require('../middleware/authenticate');
const { validateCouponSchema } = require('../validators/coupon.validator');

const router = express.Router();

/**
 * Coupons are never listed publicly — a code has to be known to be checked.
 * The optional session lets the per-customer usage limit apply when signed in.
 */
router.post(
  '/validate',
  optionalAuthenticate,
  validate({ body: validateCouponSchema }),
  couponController.validateCode
);

module.exports = router;
