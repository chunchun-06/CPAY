'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Save an audit log entry to the database.
 *
 * @param {Object} req - Express request object (used to extract IP)
 * @param {string} action - Action performed (from AUDIT_ACTIONS constants)
 * @param {string} entity - Entity type: 'customer' | 'loan' | 'payment' | 'admin' | 'backup'
 * @param {string|null} entityId - ID of the affected entity
 * @param {Object} [details={}] - Additional context/data for the log
 */
const auditLog = async (req, action, entity, entityId = null, details = {}) => {
  try {
    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown';

    const performedBy = req.admin?.email || 'system';

    await AuditLog.create({
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      performedBy,
      details,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit log failures should never crash the main flow
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};

module.exports = { auditLog };
