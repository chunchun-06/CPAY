'use strict';

const express = require('express');
const router = express.Router();

const { getPaymentHistory, recordPayment } = require('../controllers/paymentController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { validateCreatePayment } = require('../validators/paymentValidator');

router.use(protectAdmin);

router.get('/loan/:loanId', getPaymentHistory);
router.post('/', validateCreatePayment, recordPayment);

module.exports = router;
