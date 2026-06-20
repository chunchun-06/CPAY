'use strict';

const express = require('express');
const router = express.Router();

const {
  getStats,
  getOverdueCustomers,
  getRecentPayments,
} = require('../controllers/dashboardController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.use(protectAdmin);

router.get('/stats', getStats);
router.get('/overdue', getOverdueCustomers);
router.get('/recent-payments', getRecentPayments);

module.exports = router;
