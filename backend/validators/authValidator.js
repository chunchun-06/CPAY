'use strict';

const Joi = require('joi');
const { sendError } = require('../helpers/responseHelper');

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
});

/**
 * Middleware factory — validates req.body against a Joi schema.
 * @param {Joi.Schema} schema
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.context?.key || 'unknown',
      message: d.message.replace(/['"]/g, ''),
    }));
    return sendError(res, 'Validation failed', 422, errors);
  }
  next();
};

module.exports = {
  validateLogin: validate(loginSchema),
};
