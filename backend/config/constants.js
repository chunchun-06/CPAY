'use strict';

const LOAN_STATUS = Object.freeze({
  ACTIVE: 'active',
  CLOSED: 'closed',
});

const PAYMENT_STATUS = Object.freeze({
  PAID: 'paid',
  PENDING: 'pending',
  UPCOMING: 'upcoming',
});

const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RESTORE: 'restore',
  LOGIN: 'login',
  LOGOUT: 'logout',
  GENERATE_TOKEN: 'generate_token',
  RECORD_PAYMENT: 'record_payment',
  CLOSE_LOAN: 'close_loan',
  EXPORT: 'export',
});

const ROLES = Object.freeze({
  ADMIN: 'admin',
});

module.exports = {
  LOAN_STATUS,
  PAYMENT_STATUS,
  AUDIT_ACTIONS,
  ROLES,
};
