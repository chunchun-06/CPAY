'use strict';

const express = require('express');
const router = express.Router();

const {
  exportCustomerPDF,
  exportCustomerCSV,
  backupDatabase,
  restoreDatabase,
} = require('../controllers/exportController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.use(protectAdmin);

router.get('/customer/:id/pdf', exportCustomerPDF);
router.get('/customer/:id/csv', exportCustomerCSV);
router.get('/backup', backupDatabase);
router.post('/restore', restoreDatabase);

module.exports = router;
