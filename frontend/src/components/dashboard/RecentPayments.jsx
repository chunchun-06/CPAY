import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Spinner from '../ui/Spinner';

export default function RecentPayments({ payments = [], loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        {t('dashboardStats.noRecentPayments')}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {payments.map((p, idx) => (
        <div
          key={p._id || idx}
          className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="text-emerald-400 text-xs font-semibold">
                {p.customer?.fullName?.slice(0, 2).toUpperCase() || 'NA'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {p.customer?.fullName || t('common.unknown')}
              </p>
              <p className="text-xs text-slate-500">{formatDate(p.date || p.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-bold text-emerald-600">
              {formatCurrency(p.totalPaid || p.amount || 0)}
            </span>
            <Badge status={p.status || 'paid'} />
          </div>
        </div>
      ))}
    </div>
  );
}
