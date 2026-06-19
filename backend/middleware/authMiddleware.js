'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { sendError } = require('../helpers/responseHelper');

/**
 * protectAdmin — JWT auth middleware for admin-only routes.
 * Reads the token from the httpOnly cookie 'cpay_token'.
 */
const protectAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.cpay_token;

    if (!token) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's our env admin
    if (decoded.id !== 'admin_env') {
      return sendError(res, 'Admin account no longer exists.', 401);
    }

    req.admin = {
      _id: 'admin_env',
      email: process.env.ADMIN_EMAIL,
      lastLogin: new Date(),
      createdAt: new Date()
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token. Please log in again.', 401);
    }
    next(error);
  }
};

module.exports = { protectAdmin };
