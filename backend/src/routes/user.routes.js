'use strict';

const express = require('express');

const userController = require('../controllers/user.controller');
const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { uploadSingle } = require('../middleware/upload');
const { idParam, orderNumberParam } = require('../validators/common.validator');
const {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  wishlistItemSchema,
  productIdParamSchema,
} = require('../validators/user.validator');
const { listQuerySchema, cancelSchema } = require('../validators/order.validator');

const router = express.Router();

// Everything under /users/me belongs to the signed-in customer.
router.use(authenticate);

// ----- Profile -------------------------------------------------------------
router.get('/me', userController.getProfile);
router.patch('/me', validate({ body: updateProfileSchema }), userController.updateProfile);
router.post('/me/avatar', uploadSingle('avatar'), userController.updateAvatar);
router.get('/me/dashboard', userController.getDashboard);

// ----- Addresses -----------------------------------------------------------
router.get('/me/addresses', userController.listAddresses);
router.post('/me/addresses', validate({ body: createAddressSchema }), userController.createAddress);
router.put(
  '/me/addresses/:id',
  validate({ params: idParam, body: updateAddressSchema }),
  userController.updateAddress
);
router.patch(
  '/me/addresses/:id/default',
  validate({ params: idParam }),
  userController.setDefaultAddress
);
router.delete('/me/addresses/:id', validate({ params: idParam }), userController.removeAddress);

// ----- Wishlist ------------------------------------------------------------
router.get('/me/wishlist', userController.listWishlist);
router.post('/me/wishlist', validate({ body: wishlistItemSchema }), userController.addToWishlist);
router.post(
  '/me/wishlist/toggle',
  validate({ body: wishlistItemSchema }),
  userController.toggleWishlist
);
router.delete(
  '/me/wishlist/:productId',
  validate({ params: productIdParamSchema }),
  userController.removeFromWishlist
);

// ----- Orders --------------------------------------------------------------
router.get('/me/orders', validate({ query: listQuerySchema }), orderController.listMine);
router.post(
  '/me/orders/:orderNumber/cancel',
  validate({ params: orderNumberParam, body: cancelSchema }),
  orderController.cancelMine
);

module.exports = router;
