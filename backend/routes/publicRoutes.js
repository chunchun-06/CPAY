'use strict';

const express = require('express');
const router = express.Router();

const { getCustomerByToken } = require('../controllers/publicController');

// No authentication required for public routes
router.get('/customer/:linkParam', getCustomerByToken);

module.exports = router;
