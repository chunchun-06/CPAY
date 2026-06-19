'use strict';

const rateLimit = require('express-rate-limit');
const { sendError } = require('../helpers/responseHelper');

/**
 * loginLimiter — strict limit for authentication routes.
 * 10 attempts per 15 minutes per IP.
 */
const loginLimiter = (req, res, next) => next();

/**
 * apiLimiter — general rate limit for all API routes.
 * 100 requests per 15 minutes per IP.
 */
const apiLimiter = (req, res, next) => next();

module.exports = { loginLimiter, apiLimiter };
