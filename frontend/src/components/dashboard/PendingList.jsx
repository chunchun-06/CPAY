import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatMobile } from '../../utils/formatters';
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
        No overdue customers at the moment.
      </div>
    );
  }

  const getOverdueColor = (days) => {
    if (days > 30) return 'text-rose-700 bg-rose-100 border-rose-200';
    if (days >= 8) return 'text-red-600 bg-red-50 border-red-100';
    return 'text-orange-600 bg-orange-50 border-orange-100';
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const c = item.customer;
        const l = item.loan;
        const days = l.daysOverdue;
        const colorClass = getOverdueColor(days);

        return (
          <Link
            key={item.id}
            to={`/customers/${c.token}`}
            className="block border border-slate-100 rounded-xl p-4 hover:border-slate-300 transition-colors group bg-white shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600">{c.fullName}</h4>
                <p className="text-xs font-medium text-slate-500">{formatMobile(c.mobileNumber)}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${colorClass}`}>
                {days} Days Overdue
              </span>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Due Date</p>
                <p className="text-xs font-semibold text-slate-700">{new Date(l.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pending Interest</p>
                <p className="text-sm font-black text-rose-600">{formatCurrency(l.pendingInterest)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Remaining Principal</p>
                <p className="text-sm font-black text-slate-800">{formatCurrency(l.remainingPrincipal)}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
