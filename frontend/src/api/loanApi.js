import axiosInstance from './axiosInstance';

export const getLoanByCustomer = (customerId) =>
  axiosInstance.get(`/loans/customer/${customerId}`);

export const updateLoan = (id, data) =>
  axiosInstance.put(`/loans/${id}`, data);

export const closeLoan = (id) => axiosInstance.patch(`/loans/${id}/close`);
