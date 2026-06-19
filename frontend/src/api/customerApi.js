import axiosInstance from './axiosInstance';

export const getAllCustomers = (params = {}) =>
  axiosInstance.get('/customers', { params });

export const getCustomerById = (id) => axiosInstance.get(`/customers/${id}`);

export const createCustomer = (data) => axiosInstance.post('/customers', data);

export const updateCustomer = (id, data) =>
  axiosInstance.put(`/customers/${id}`, data);

export const deleteCustomer = (id) => axiosInstance.delete(`/customers/${id}`);

export const restoreCustomer = (id) =>
  axiosInstance.patch(`/customers/${id}/restore`);

export const regenerateToken = (id) =>
  axiosInstance.patch(`/customers/${id}/regenerate-token`);

export const getDeletedCustomers = () => axiosInstance.get('/customers/deleted');
