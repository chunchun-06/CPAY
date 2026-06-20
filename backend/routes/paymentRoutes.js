'use strict';

const express = require('express');
const router = express.Router();

const { getPaymentHistory, recordPayment, updatePayment, deletePayment } = require('../controllers/paymentController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { validateCreatePayment, validateUpdatePayment } = require('../validators/paymentValidator');

router.use(protectAdmin);

router.get('/loan/:loanId', getPaymentHistory);
router.post('/', validateCreatePayment, recordPayment);
router.put('/:id', validateUpdatePayment, updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;
