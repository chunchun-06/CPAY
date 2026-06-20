'use strict';

const Joi = require('joi');
const { sendError } = require('../helpers/responseHelper');

const createPaymentSchema = Joi.object({
  loanId: Joi.string().required().messages({
    'any.required': 'Loan ID is required',
  }),
  customerId: Joi.string().optional().messages({
    'any.required': 'Customer ID is required',
  }),
  date: Joi.date().iso().required().messages({
    'date.format': 'Payment date must be a valid ISO date',
    'any.required': 'Payment date is required',
  }),
  totalAmount: Joi.number().positive().required().messages({
    'number.positive': 'Total amount must be positive',
    'any.required': 'Total amount is required',
  }),
  interestPaid: Joi.number().min(0).required().messages({
    'number.min': 'Interest paid cannot be negative',
    'any.required': 'Interest paid is required',
  }),
  principalPaid: Joi.number().min(0).required().messages({
    'number.min': 'Principal paid cannot be negative',
    'any.required': 'Principal paid is required',
  }),
  remarks: Joi.string().max(500).optional().allow(''),
});

const updatePaymentSchema = Joi.object({
  date: Joi.date().iso().required().messages({
    'date.format': 'Payment date must be a valid ISO date',
    'any.required': 'Payment date is required',
  }),
  totalAmount: Joi.number().positive().required().messages({
    'number.positive': 'Total amount must be positive',
    'any.required': 'Total amount is required',
  }),
  interestPaid: Joi.number().min(0).required().messages({
    'number.min': 'Interest paid cannot be negative',
    'any.required': 'Interest paid is required',
  }),
  principalPaid: Joi.number().min(0).required().messages({
    'number.min': 'Principal paid cannot be negative',
    'any.required': 'Principal paid is required',
  }),
  remarks: Joi.string().max(500).optional().allow(''),
});

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
  validateCreatePayment: validate(createPaymentSchema),
  validateUpdatePayment: validate(updatePaymentSchema),
};
