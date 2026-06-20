import axiosInstance from './axiosInstance';

export const getStats = () => axiosInstance.get('/dashboard/stats');

export const getOverdueCustomers = async () => {
  const response = await axiosInstance.get('/dashboard/overdue');
  return response.data;
};

export const getRecentPayments = () =>
  axiosInstance.get('/dashboard/recent-payments');
