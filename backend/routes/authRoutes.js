'use strict';

const express = require('express');
const router = express.Router();

const { login, logout, getMe } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidator');
const { protectAdmin } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me
router.get('/me', protectAdmin, getMe);

module.exports = router;
