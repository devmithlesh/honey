'use strict';

const express = require('express');

const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { optionalAuthenticate } = require('../middleware/authenticate');
const { orderNumberParam } = require('../validators/common.validator');
const { quoteSchema, createOrderSchema } = require('../validators/order.validator');

const router = express.Router();

/**
 * Checkout is open to guests, so these routes use the soft authentication
 * gate: a signed-in customer gets the order attached to their account, and a
 * guest still receives a valid order.
 */
router.post('/quote', optionalAuthenticate, validate({ body: quoteSchema }), orderController.quote);

router.post('/', optionalAuthenticate, validate({ body: createOrderSchema }), orderController.create);

router.get(
  '/:orderNumber',
  optionalAuthenticate,
  validate({ params: orderNumberParam }),
  orderController.getByOrderNumber
);

module.exports = router;
