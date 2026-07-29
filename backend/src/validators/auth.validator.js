'use strict';

const Joi = require('joi');

const { email, phone, password } = require('./common.validator');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: email.required(),
  phone: phone.allow('', null),
  password: password.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({ 'any.only': 'Passwords do not match' }),
});

const loginSchema = Joi.object({
  email: email.required(),
  // Deliberately not the strong-password rule: an existing account must be able
  // to sign in even if the policy tightens later.
  password: Joi.string().min(1).max(128).required(),
});

const forgotPasswordSchema = Joi.object({
  email: email.required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).required().messages({
    'any.required': 'This reset link is incomplete. Request a new one.',
  }),
  password: password.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({ 'any.only': 'Passwords do not match' }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
  newPassword: password.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .messages({ 'any.only': 'Passwords do not match' }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
