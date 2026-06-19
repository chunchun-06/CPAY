import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import CustomerCard from '../components/customers/CustomerCard';
import CustomerSearch from '../components/customers/CustomerSearch';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import useCustomers from '../hooks/useCustomers';
import useToast from '../hooks/useToast';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="h-14 bg-slate-100 rounded-xl" />
      </div>
      <div className="mt-4 h-10 bg-slate-200 rounded-xl" />
    </div>
  );
}

export default function Customers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, loading, fetchCustomers, fetchDeletedCustomers, deleteCustomer, restoreCustomer } = useCustomers();
  const toast = useToast();

  const [showDeleted, setShowDeleted] = useState(location.pathname.includes('deleted'));
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Read initial search from URL
  const urlSearch = new URLSearchParams(location.search).get('search') || '';

  const load = useCallback(
    (search = '') => {
      if (showDeleted) fetchDeletedCustomers();
      else fetchCustomers(search);
    },
    [showDeleted, fetchCustomers, fetchDeletedCustomers]
  );

  useEffect(() => {
    load(urlSearch);
  }, [showDeleted]);

  const handleSearch = useCallback(
    (q) => {
      if (!showDeleted) fetchCustomers(q);
    },
    [showDeleted, fetchCustomers]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteCustomer(deleteTarget.token);
      toast.success(t('customer.deletedSuccess', { name: deleteTarget.fullName }));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.deleteFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    try {
      await restoreCustomer(restoreTarget.token);
      toast.success(t('customer.restoredSuccess', { name: restoreTarget.fullName }));
      setRestoreTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('customer.restoreFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout pageTitle={showDeleted ? t('common.deletedCustomers') : t('common.customers')}>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {!showDeleted && (
            <div className="flex-1 w-full">
              <CustomerSearch onSearch={handleSearch} />
            </div>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={showDeleted ? 'ghost' : 'secondary'}
              size="md"
              onClick={() => setShowDeleted((p) => !p)}
              className={showDeleted ? 'border-amber-500/30 text-amber-400' : ''}
            >
              {showDeleted ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('status.active')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('common.deleted')}
                </>
              )}
            </Button>
            {!showDeleted && (
              <Link to="/customers/add" className="flex-1 sm:flex-none">
                <Button variant="primary" size="md" fullWidth>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('common.addCustomer')}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-sm text-slate-500">
            {customers.length} {showDeleted ? t('common.deleted') : ''} {customers.length !== 1 ? t('common.customers') : t('common.customer')}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {showDeleted ? t('customer.noDeletedCustomers') : t('customer.noCustomersYet')}
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs">
              {showDeleted
                ? t('customer.deletedWillAppearHere')
                : t('customer.addFirstToStart')}
            </p>
            {!showDeleted && (
              <Link to="/customers/add">
                <Button variant="primary">{t('customer.addFirstCustomer')}</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {customers.map((c) =>
              showDeleted ? (
                <div
                  key={c.token}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-70"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{c.fullName}</h3>
                      <p className="text-sm font-medium text-slate-500">{c.mobileNumber}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs bg-rose-500/20 text-rose-400 border border-rose-500/20">
                      {t('common.deleted')}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setRestoreTarget(c)}
                  >
                    {t('customer.restoreCustomer')}
                  </Button>
                </div>
              ) : (
                <CustomerCard
                  key={c.token}
                  customer={c}
                  onEdit={() => navigate(`/customers/${c.token}/edit`)}
                  onDelete={() => setDeleteTarget(c)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('common.deleteCustomer')}
        message={t('customer.deleteCustomerDesc', { name: deleteTarget?.fullName })}
        confirmText={t('common.delete')}
        danger
        loading={actionLoading}
      />

      {/* Restore confirm */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title={t('customer.restoreCustomer')}
        message={t('customer.restoreCustomerDesc', { name: restoreTarget?.fullName })}
        confirmText={t('common.restore')}
        loading={actionLoading}
      />
    </Layout>
  );
}
