import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import CustomerForm from '../components/customers/CustomerForm';
import Card from '../components/ui/Card';
import useCustomers from '../hooks/useCustomers';
import useToast from '../hooks/useToast';

export default function AddCustomer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const customer = await createCustomer(formData);
      toast.success(t('customer.addedSuccess'));
      const token = customer.token || customer.secureToken;
      if (token) {
        navigate(`/customers/${token}`);
      } else {
        navigate('/customers');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle={t('common.addCustomer')}>
      <div className="max-w-2xl mx-auto">
        <Card title={t('customer.newCustomer')} subtitle={t('customer.newCustomerSub')}>
          <CustomerForm
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel={t('common.addCustomer')}
          />
        </Card>
      </div>
    </Layout>
  );
}
