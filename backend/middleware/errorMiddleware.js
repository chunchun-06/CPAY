'use strict';

const logger = require('../utils/logger');

/**
 * Centralized Express error handling middleware.
 * Must have exactly 4 parameters to be recognized as error middleware.
 */
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // --- Mongoose Validation Error ---
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // --- Mongoose CastError (invalid ObjectId) ---
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // --- MongoDB Duplicate Key Error ---
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `'${field}' already exists. Please use a unique value.`;
  }

  // --- JWT Errors ---
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // --- Joi Validation Error (from validators) ---
  if (err.isJoi) {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.details.map((d) => ({
      field: d.context?.key || 'unknown',
      message: d.message.replace(/['"]/g, ''),
    }));
  }

  // Log server errors (not 4xx)
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} — ${message}`, {
      stack: err.stack,
      body: req.body,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${statusCode}: ${message}`);
  }

  const response = {
    success: false,
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  // Never expose stack traces in production
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
