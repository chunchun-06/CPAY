'use strict';

const express = require('express');
const router = express.Router();

const {
  getAllCustomers,
  getDeletedCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  regenerateToken,
} = require('../controllers/customerController');

const { protectAdmin } = require('../middleware/authMiddleware');
const { validateCreateCustomer, validateUpdateCustomer } = require('../validators/customerValidator');

// All routes below require admin authentication
router.use(protectAdmin);

router.get('/', getAllCustomers);
router.get('/deleted', getDeletedCustomers);
router.get('/:id', getCustomerById);
router.post('/', validateCreateCustomer, createCustomer);
router.put('/:id', validateUpdateCustomer, updateCustomer);
router.delete('/:id', deleteCustomer);
router.patch('/:id/restore', restoreCustomer);
router.post('/:id/regenerate-token', regenerateToken);

module.exports = router;
