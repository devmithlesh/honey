'use strict';

const Joi = require('joi');

const { id, pagination } = require('./common.validator');
const { REVIEW_STATUS } = require('../constants');

const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'any.required': 'Choose a rating from 1 to 5 stars',
  }),
  title: Joi.string().trim().max(150).allow('', null),
  comment: Joi.string().trim().max(2000).allow('', null),
});

const listQuerySchema = Joi.object(pagination);

const adminListQuerySchema = Joi.object({
  ...pagination,
  status: Joi.string().valid(...Object.values(REVIEW_STATUS)),
  productId: id,
});

const setStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(REVIEW_STATUS))
    .required(),
  adminNote: Joi.string().trim().max(255).allow('', null),
});

module.exports = { createReviewSchema, listQuerySchema, adminListQuerySchema, setStatusSchema };
