import axiosInstance from './axiosInstance';

export const login = (email, password) =>
  axiosInstance.post('/auth/login', { email, password });

export const logout = () => axiosInstance.post('/auth/logout');

export const getMe = () => axiosInstance.get('/auth/me');
