import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';
import Spinner from '../ui/Spinner';

export default function PendingList({ items = [], loading = false }) {
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
        {t('dashboardStats.noPendingPayments')}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, idx) => {
        const customer = item.customer || item;
        const loan = item.loan || item;
        const daysOverdue = item.daysOverdue || 0;
        return (
          <Link
            key={item.id || idx}
            to={`/customers/${customer.token || customer.id || item.customerId}`}
            className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${daysOverdue > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-500'}`}>
                <span className="text-xs font-semibold">
                  {(customer.fullName || item.fullName || 'NA').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {customer.fullName || item.fullName || t('common.unknown')}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500">
                    {t('fields.dueDate')}: {new Date(loan.dueDate || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </p>
                  {daysOverdue > 0 && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                      {t('dashboardStats.daysOverdue', { count: daysOverdue })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-sm font-bold text-slate-700">
                {formatCurrency(loan.monthlyInterest || item.monthlyInterest || item.amountOwed || 0)}
              </span>
              <span className={`text-[10px] uppercase tracking-wider font-bold mt-1 px-2 py-0.5 rounded ${daysOverdue > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                {daysOverdue > 0 ? t('status.pending') : t('status.upcoming')}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
