'use strict';

const Joi = require('joi');
const { sendError } = require('../helpers/responseHelper');

const createCustomerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),
  mobileNumber: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Mobile number must be a valid 10-digit Indian number starting with 6-9',
      'any.required': 'Mobile number is required',
    }),
  address: Joi.string().trim().max(300).optional().allow('').messages({
    'string.max': 'Address cannot exceed 300 characters',
  }),
  notes: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Notes cannot exceed 1000 characters',
  }),
  // Loan fields required on creation
  loanAmount: Joi.number().positive().required().messages({
    'number.positive': 'Loan amount must be a positive number',
    'any.required': 'Loan amount is required',
  }),
  interestRate: Joi.number().min(0.1).max(100).required().messages({
    'number.min': 'Interest rate must be at least 0.1%',
    'number.max': 'Interest rate cannot exceed 100%',
    'any.required': 'Interest rate is required',
  }),
  monthlyDueDay: Joi.number().integer().min(1).max(31).required().messages({
    'number.min': 'Monthly due day must be between 1 and 31',
    'number.max': 'Monthly due day must be between 1 and 31',
    'any.required': 'Monthly due day is required',
  }),
  loanStartDate: Joi.date().iso().required().messages({
    'date.format': 'Loan start date must be a valid ISO date',
    'any.required': 'Loan start date is required',
  }),
});

const updateCustomerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  mobileNumber: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Mobile number must be a valid 10-digit Indian number',
    }),
  address: Joi.string().trim().max(300).optional().allow(''),
  notes: Joi.string().max(1000).optional().allow(''),
}).min(1);

/**
 * Middleware factory — validates req.body against a Joi schema.
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
  validateCreateCustomer: validate(createCustomerSchema),
  validateUpdateCustomer: validate(updateCustomerSchema),
};
