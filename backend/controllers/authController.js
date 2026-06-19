'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../helpers/responseHelper');
const { auditLog } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

/**
 * @route  POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (!envEmail || !envPassword) {
    return sendError(res, 'Admin credentials not configured in environment variables.', 500);
  }

  if (email.toLowerCase().trim() !== envEmail.toLowerCase().trim() || password !== envPassword) {
    return sendError(res, 'Invalid email or password.', 401);
  }

  // Sign JWT
  const token = jwt.sign({ id: 'admin_env' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Set httpOnly cookie
  res.cookie('cpay_token', token, cookieOptions);

  // Audit log
  await auditLog(req, AUDIT_ACTIONS.LOGIN, 'admin', 'admin_env', {
    email: envEmail,
  });

  return sendSuccess(
    res,
    {
      admin: {
        email: envEmail,
        lastLogin: new Date(),
        createdAt: new Date(),
      },
    },
    'Login successful.'
  );
});

/**
 * @route  POST /api/auth/logout
 * @access Public
 */
const logout = asyncHandler(async (req, res) => {
  // Optionally log if admin is in request
  if (req.admin) {
    await auditLog(req, AUDIT_ACTIONS.LOGOUT, 'admin', req.admin._id.toString(), {
      email: req.admin.email,
    });
  }

  res.clearCookie('cpay_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });

  return sendSuccess(res, null, 'Logged out successfully.');
});

/**
 * @route  GET /api/auth/me
 * @access Protected (Admin)
 */
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(
    res,
    {
      admin: {
        email: req.admin.email,
        lastLogin: req.admin.lastLogin,
        createdAt: req.admin.createdAt,
      },
    },
    'Admin profile retrieved.'
  );
});

module.exports = { login, logout, getMe };
