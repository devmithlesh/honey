'use strict';

const express = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const productController = require('../controllers/product.controller');
const categoryController = require('../controllers/category.controller');
const orderController = require('../controllers/order.controller');
const userController = require('../controllers/user.controller');
const reviewController = require('../controllers/review.controller');
const couponController = require('../controllers/coupon.controller');
const settingController = require('../controllers/setting.controller');

const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { requireAdmin } = require('../middleware/authorize');
const { uploadSingle, uploadMany } = require('../middleware/upload');

const { idParam, pagination } = require('../validators/common.validator');
const Joi = require('joi');
const {
  adminListQuerySchema,
  createProductSchema,
  updateProductSchema,
  imageIdParamSchema,
} = require('../validators/product.validator');
const {
  createCategorySchema,
  updateCategorySchema,
} = require('../validators/category.validator');
const {
  listQuerySchema: orderListQuerySchema,
  updateStatusSchema,
  updatePaymentSchema,
} = require('../validators/order.validator');
const {
  customerListQuerySchema,
  setCustomerStatusSchema,
} = require('../validators/user.validator');
const {
  adminListQuerySchema: reviewListQuerySchema,
  setStatusSchema,
} = require('../validators/review.validator');
const {
  createCouponSchema,
  updateCouponSchema,
  listQuerySchema: couponListQuerySchema,
} = require('../validators/coupon.validator');
const { updateSettingsSchema } = require('../validators/setting.validator');

const router = express.Router();

// Every admin route requires a valid session *and* the admin role.
router.use(authenticate, requireAdmin);

// ----- Dashboard -----------------------------------------------------------
router.get('/dashboard', dashboardController.overview);
router.get(
  '/notifications',
  validate({ query: Joi.object(pagination) }),
  dashboardController.notifications
);
router.patch(
  '/notifications/:id/read',
  validate({ params: idParam }),
  dashboardController.markNotificationRead
);
router.patch('/notifications/read-all', dashboardController.markAllNotificationsRead);

// ----- Products ------------------------------------------------------------
router.get('/products', validate({ query: adminListQuerySchema }), productController.adminList);
router.get('/products/:id', validate({ params: idParam }), productController.adminGet);

/**
 * Product writes accept `multipart/form-data`, so multer runs before the
 * validator — it is what populates `req.body` from the multipart stream.
 */
router.post(
  '/products',
  uploadMany('images'),
  validate({ body: createProductSchema }),
  productController.create
);
router.put(
  '/products/:id',
  uploadMany('images'),
  validate({ params: idParam, body: updateProductSchema }),
  productController.update
);
router.delete('/products/:id', validate({ params: idParam }), productController.remove);

router.post(
  '/products/:id/images',
  uploadMany('images'),
  validate({ params: idParam }),
  productController.addImages
);
router.patch(
  '/products/:id/images/:imageId/primary',
  validate({ params: imageIdParamSchema }),
  productController.setPrimaryImage
);
router.delete(
  '/products/:id/images/:imageId',
  validate({ params: imageIdParamSchema }),
  productController.removeImage
);

// ----- Categories ----------------------------------------------------------
router.get('/categories', categoryController.adminList);
router.get('/categories/:id', validate({ params: idParam }), categoryController.adminGet);
router.post(
  '/categories',
  uploadSingle('image'),
  validate({ body: createCategorySchema }),
  categoryController.create
);
router.put(
  '/categories/:id',
  uploadSingle('image'),
  validate({ params: idParam, body: updateCategorySchema }),
  categoryController.update
);
router.delete('/categories/:id', validate({ params: idParam }), categoryController.remove);

// ----- Orders --------------------------------------------------------------
router.get('/orders', validate({ query: orderListQuerySchema }), orderController.adminList);
router.get('/orders/:id', validate({ params: idParam }), orderController.adminGet);
router.get('/orders/:id/invoice', validate({ params: idParam }), orderController.invoice);
router.patch(
  '/orders/:id/status',
  validate({ params: idParam, body: updateStatusSchema }),
  orderController.updateStatus
);
router.patch(
  '/orders/:id/payment',
  validate({ params: idParam, body: updatePaymentSchema }),
  orderController.updatePayment
);

// ----- Customers -----------------------------------------------------------
router.get(
  '/customers',
  validate({ query: customerListQuerySchema }),
  userController.adminListCustomers
);
router.get('/customers/:id', validate({ params: idParam }), userController.adminGetCustomer);
router.patch(
  '/customers/:id/status',
  validate({ params: idParam, body: setCustomerStatusSchema }),
  userController.adminSetCustomerStatus
);

// ----- Reviews -------------------------------------------------------------
router.get('/reviews', validate({ query: reviewListQuerySchema }), reviewController.adminList);
router.patch(
  '/reviews/:id/status',
  validate({ params: idParam, body: setStatusSchema }),
  reviewController.setStatus
);
router.delete('/reviews/:id', validate({ params: idParam }), reviewController.remove);

// ----- Coupons -------------------------------------------------------------
router.get('/coupons', validate({ query: couponListQuerySchema }), couponController.adminList);
router.get('/coupons/:id', validate({ params: idParam }), couponController.adminGet);
router.post('/coupons', validate({ body: createCouponSchema }), couponController.create);
router.put(
  '/coupons/:id',
  validate({ params: idParam, body: updateCouponSchema }),
  couponController.update
);
router.delete('/coupons/:id', validate({ params: idParam }), couponController.remove);

// ----- Settings ------------------------------------------------------------
router.get('/settings', settingController.getAll);
router.put('/settings', validate({ body: updateSettingsSchema }), settingController.update);
router.post(
  '/settings/:key/image',
  uploadSingle('image'),
  validate({
    params: Joi.object({
      key: Joi.string()
        .valid('site_logo_url', 'upi_qr_url', 'og_image_url')
        .required()
        .messages({ 'any.only': 'That setting does not accept an image' }),
    }),
  }),
  settingController.uploadImageSetting
);

module.exports = router;
