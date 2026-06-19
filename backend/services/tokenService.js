'use strict';

const crypto = require('crypto');

/**
 * Generate a cryptographically random secure token.
 * @returns {string} Hex string
 */
const generateSecureToken = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate the full public customer link using customerId and token.
 * @param {string} customerId - The sequential Customer ID
 * @param {string} token - The customer's secure crypto token
 * @param {string} baseUrl - The frontend base URL
 * @returns {string} Full URL to customer's public page
 */
const generateCustomerLink = (customerId, token, baseUrl) => {
  if (!customerId || !token) return null;
  const cleanBase = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  return `${cleanBase}/customer/${customerId}-${token}`;
};

module.exports = {
  generateSecureToken,
  generateCustomerLink,
};
