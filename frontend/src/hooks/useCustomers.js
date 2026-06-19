import { useState, useCallback } from 'react';
import {
  getAllCustomers,
  createCustomer as apiCreate,
  updateCustomer as apiUpdate,
  deleteCustomer as apiDelete,
  restoreCustomer as apiRestore,
  getDeletedCustomers,
} from '../api/customerApi';

export default function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllCustomers(search ? { search } : {});
      setCustomers(data.data || data.customers || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeletedCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getDeletedCustomers();
      setCustomers(data.data || data.customers || data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load deleted customers');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (formData) => {
    const { data } = await apiCreate(formData);
    return data.data || data.customer || data;
  }, []);

  const updateCustomer = useCallback(async (id, formData) => {
    const { data } = await apiUpdate(id, formData);
    return data.data || data.customer || data;
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    await apiDelete(id);
    setCustomers((prev) => prev.filter((c) => c.token !== id));
  }, []);

  const restoreCustomer = useCallback(async (id) => {
    const { data } = await apiRestore(id);
    setCustomers((prev) => prev.filter((c) => c.token !== id));
    return data;
  }, []);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    fetchDeletedCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
  };
}
