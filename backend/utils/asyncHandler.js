'use strict';

/**
 * Wraps an async route handler to forward errors to Express error middleware.
 * Eliminates repetitive try-catch blocks in controllers.
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
