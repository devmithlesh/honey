'use strict';

const express = require('express');

const categoryController = require('../controllers/category.controller');
const validate = require('../middleware/validate');
const { slugParam } = require('../validators/common.validator');

const router = express.Router();

router.get('/', categoryController.list);
router.get('/:slug', validate({ params: slugParam }), categoryController.getBySlug);

module.exports = router;
