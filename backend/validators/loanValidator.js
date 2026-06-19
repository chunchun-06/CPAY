'use strict';

const Joi = require('joi');
const { sendError } = require('../helpers/responseHelper');

const createLoanSchema = Joi.object({
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required',
  }),
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

const updateLoanSchema = Joi.object({
  interestRate: Joi.number().min(0.1).max(100).optional(),
  monthlyDueDay: Joi.number().integer().min(1).max(31).optional(),
  loanStartDate: Joi.date().iso().optional(),
  loanAmount: Joi.number().positive().optional(),
}).min(1);

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
  validateCreateLoan: validate(createLoanSchema),
  validateUpdateLoan: validate(updateLoanSchema),
};
