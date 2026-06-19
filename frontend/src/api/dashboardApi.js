import axiosInstance from './axiosInstance';

export const getStats = () => axiosInstance.get('/dashboard/stats');

export const getMonthlyPendingCustomers = () => axiosInstance.get('/dashboard/monthly-pending');

export const getRecentPayments = () =>
  axiosInstance.get('/dashboard/recent-payments');
