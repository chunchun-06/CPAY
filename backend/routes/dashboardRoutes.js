'use strict';

const express = require('express');
const router = express.Router();

const {
  getStats,
  getMonthlyPendingCustomers,
  getRecentPayments,
} = require('../controllers/dashboardController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.use(protectAdmin);

router.get('/stats', getStats);
router.get('/monthly-pending', getMonthlyPendingCustomers);
router.get('/recent-payments', getRecentPayments);

module.exports = router;
