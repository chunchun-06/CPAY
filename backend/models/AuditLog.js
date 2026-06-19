'use strict';

const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../config/constants');

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: Object.values(AUDIT_ACTIONS),
    },
    entity: {
      type: String,
      required: [true, 'Entity is required'],
      enum: ['customer', 'loan', 'payment', 'admin', 'backup'],
    },
    entityId: {
      type: String,
      default: null,
    },
    performedBy: {
      type: String,
      default: 'admin',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No auto timestamps — we manage timestamp manually for consistency
    versionKey: false,
  }
);

// TTL index — auto-delete audit logs older than 1 year
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
