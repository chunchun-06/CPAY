export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const LOAN_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
};

export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  UPCOMING: 'upcoming',
};
