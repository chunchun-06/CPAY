import axiosInstance from './axiosInstance';

export const getPaymentHistory = (loanId) =>
  axiosInstance.get(`/payments/loan/${loanId}`);

export const recordPayment = (data) => axiosInstance.post('/payments', data);
