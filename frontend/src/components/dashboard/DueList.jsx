import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import { formatCurrency, formatDate, getOrdinal } from '../../utils/formatters';
import Spinner from '../ui/Spinner';

export default function DueList({ items = [], loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        {t('dashboardStats.noCustomersDue')}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, idx) => {
        const customer = item.customer || item;
        const loan = item.loan || item;
        return (
          <Link
            key={item.id || idx}
            to={`/customers/${customer.token || customer.id || item.customerId}`}
            className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-amber-400 text-xs font-semibold">
                  {(customer.fullName || item.fullName || 'NA').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {customer.fullName || item.fullName || t('common.unknown')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('fields.dueDate')}: {t('customer.ordinalOfMonth', { ordinal: getOrdinal(loan.monthlyDueDay || item.monthlyDueDay || 1) })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold text-slate-700">
                {formatCurrency(loan.monthlyInterest || item.monthlyInterest || 0)}
              </span>
              <Badge status={item.paymentStatus || 'pending'} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
