'use strict';

const express = require('express');

const settingController = require('../controllers/setting.controller');

const router = express.Router();

/** Storefront configuration: contact details, shipping rules, UPI, SEO copy. */
router.get('/', settingController.getPublic);

module.exports = router;
