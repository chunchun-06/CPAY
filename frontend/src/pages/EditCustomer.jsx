import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import CustomerForm from '../components/customers/CustomerForm';
import Card from '../components/ui/Card';
import Spinner from '../components/ui/Spinner';
import { getCustomerById } from '../api/customerApi';
import useCustomers from '../hooks/useCustomers';
import useToast from '../hooks/useToast';

export default function EditCustomer() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateCustomer } = useCustomers();
  const toast = useToast();

  const [customer, setCustomer] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getCustomerById(id);
        setCustomer(data.data || data.customer || data);
      } catch {
        toast.error(t('customer.notFound'));
        navigate('/customers');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, navigate, t, toast]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      await updateCustomer(id, formData);
      toast.success(t('customer.updatedSuccess'));
      navigate(`/customers/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <Layout pageTitle={t('common.editCustomer')}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle={`${t('common.edit')} — ${customer?.fullName || t('common.customer')}`}>
      <div className="max-w-2xl mx-auto">
        <Card
          title={t('customer.editCustomer')}
          subtitle={t('customer.editCustomerSub')}
        >
          <CustomerForm
            initialData={customer}
            onSubmit={handleSubmit}
            loading={saving}
            submitLabel={t('common.saveChanges')}
          />
        </Card>
      </div>
    </Layout>
  );
}
