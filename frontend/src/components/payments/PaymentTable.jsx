import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Table from '../ui/Table';
import { formatCurrency, formatDate } from '../../utils/formatters';

import Button from '../ui/Button';

export default function PaymentTable({ payments = [], loading = false, onPayPending, onEditPayment, onDeletePayment, readOnly = false }) {
  const { t } = useTranslation();

  const columns = useMemo(() => {
    const baseColumns = [
    {
      key: 'date',
      label: t('fields.date'),
      render: (v, item) => (
        <span className={item.isVirtual ? 'text-slate-500' : 'text-slate-700'}>
          {formatDate(v)}
        </span>
      ),
    },
    {
      key: 'interestPaid',
      label: t('fields.interestPaid'),
      render: (v) => (
        <span className="text-emerald-600 font-bold">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'principalPaid',
      label: t('fields.principalPaid'),
      render: (v) => (
        <span className="text-blue-600 font-bold">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'totalAmount',
      label: t('fields.totalPaid'),
      render: (v, item) => (
        <span className={item.isVirtual ? 'text-slate-500 font-bold' : 'text-slate-800 font-bold'}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: 'remainingPrincipal',
      label: t('fields.remainingPrincipal'),
      render: (v) => (
        <span className="text-amber-600 font-bold">{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'remarks',
      label: t('fields.remarks'),
      render: (v, item) => (
        <span className="text-slate-500 text-xs max-w-[150px] truncate block" title={v}>
          {v || (item?.isVirtual ? t('status.' + item.status) : '—')}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('fields.status'),
      render: (v, item) => {
        if (!item.isVirtual) {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">{t('status.paid')}</span>;
        }
        if (item.status === 'pending') {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">{t('status.overdue')}</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">{t('status.pending')}</span>;
      },
    },
  ];

  if (!readOnly) {
    baseColumns.push({
      key: 'actions',
      label: '',
      render: (_, item) => {
        if (item.isVirtual && onPayPending) {
          return (
            <Button variant="primary" size="xs" onClick={() => onPayPending(item)}>
              {t('payment.markPaid')}
            </Button>
          );
        }
        if (!item.isVirtual && onEditPayment && onDeletePayment) {
          return (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="xs" onClick={() => onEditPayment(item)}>
                {t('common.edit')}
              </Button>
              <Button variant="ghost" size="xs" onClick={() => onDeletePayment(item)} className="text-rose-600 hover:bg-rose-50">
                {t('common.delete')}
              </Button>
            </div>
          );
        }
        return null;
      }
    });
  }

  return baseColumns;
}, [t, readOnly, onPayPending]);

  return (
    <Table
      columns={columns}
      data={payments}
      loading={loading}
      emptyMessage={t('payment.noPayments')}
    />
  );
}
