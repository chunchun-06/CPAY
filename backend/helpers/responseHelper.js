'use strict';

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} [message='Something went wrong']
 * @param {number} [statusCode=500]
 * @param {Array} [errors=[]]
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = []) => {
  const payload = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Send a paginated JSON response.
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @param {string} [message='Success']
 */
const sendPaginated = (res, data, total, page, limit, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
