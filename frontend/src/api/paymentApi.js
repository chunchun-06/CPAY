import axiosInstance from './axiosInstance';

export const getPaymentHistory = (loanId) =>
  axiosInstance.get(`/payments/loan/${loanId}`);

export const createPayment = async (data) => {
  const response = await axiosInstance.post('/payments', data);
  return response.data;
};

export const updatePayment = async (id, data) => {
  const response = await axiosInstance.put(`/payments/${id}`, data);
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await axiosInstance.delete(`/payments/${id}`);
  return response.data;
};
