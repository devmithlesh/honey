'use strict';

const express = require('express');

const productController = require('../controllers/product.controller');
const reviewController = require('../controllers/review.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { slugParam } = require('../validators/common.validator');
const { listQuerySchema } = require('../validators/product.validator');
const {
  createReviewSchema,
  listQuerySchema: reviewListQuerySchema,
} = require('../validators/review.validator');

const router = express.Router();

/**
 * Public catalogue. `/featured` is declared before `/:slug` so the literal
 * segment is not captured by the slug parameter.
 */
router.get('/', validate({ query: listQuerySchema }), productController.list);
router.get('/featured', productController.featured);

router.get('/:slug', validate({ params: slugParam }), productController.detail);
router.get('/:slug/related', validate({ params: slugParam }), productController.related);

router.get(
  '/:slug/reviews',
  validate({ params: slugParam, query: reviewListQuerySchema }),
  reviewController.listForProduct
);

router.post(
  '/:slug/reviews',
  authenticate,
  validate({ params: slugParam, body: createReviewSchema }),
  reviewController.create
);

module.exports = router;
