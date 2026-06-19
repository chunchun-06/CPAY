'use strict';

const express = require('express');
const router = express.Router();

const { getLoanByCustomer, updateLoan, closeLoan } = require('../controllers/loanController');
const { protectAdmin } = require('../middleware/authMiddleware');
const { validateUpdateLoan } = require('../validators/loanValidator');

router.use(protectAdmin);

router.get('/customer/:customerId', getLoanByCustomer);
router.put('/:id', validateUpdateLoan, updateLoan);
router.patch('/:id/close', closeLoan);

module.exports = router;
