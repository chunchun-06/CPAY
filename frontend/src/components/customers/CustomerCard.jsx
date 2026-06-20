import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import { formatCurrency, formatMobile, getInitials, getOrdinal } from '../../utils/formatters';

export default function CustomerCard({ customer, onDelete, onEdit }) {
  const { t } = useTranslation();
  const loan = customer.loan || {};
  const initials = getInitials(customer.fullName);

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      {/* Top Section */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
          <span className="text-slate-600 text-sm font-bold">{initials}</span>
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-base font-bold text-slate-800 truncate flex items-center gap-2" title={customer.fullName}>
            {customer.fullName}
            {customer.customerId && (
              <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                {customer.customerId}
              </span>
            )}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-0.5">{formatMobile(customer.mobileNumber)}</p>
        </div>
      </div>

      {/* Middle Section: Compact Rows */}
      <div className="space-y-2.5 mb-5 flex-1">
        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
          <span className="text-slate-500 font-medium">{t('fields.loanAmount')}</span>
          <span className="text-slate-800 font-bold">{formatCurrency(loan.loanAmount ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
          <span className="text-slate-500 font-medium">{t('fields.remainingPrincipal')}</span>
          <span className="text-slate-800 font-bold">{formatCurrency(loan.remainingPrincipal ?? loan.loanAmount ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
          <span className="text-slate-500 font-medium">{t('fields.monthlyInterest')}</span>
          <span className="text-slate-800 font-bold">{formatCurrency(loan.monthlyInterest ?? 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">{t('fields.nextDueDate')}</span>
          <span className="text-slate-800 font-bold">
            {t('customer.ordinalOfMonth', { ordinal: getOrdinal(loan.monthlyDueDay || 1) })}
          </span>
        </div>
      </div>

      {/* Bottom Section: Status & Actions */}
      <div className="mt-auto">
        <div className="mb-4">
          {(() => {
            const s = customer.paymentStatus?.status || 'closed';
            const days = customer.paymentStatus?.daysOverdue || 0;
            if (s === 'paid') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {t('status.paid')}</span>;
            if (s === 'due_today') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {t('status.dueToday')}</span>;
            if (s === 'upcoming') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {t('status.upcoming')}</span>;
            if (s === 'pending') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"><span className="w-2 h-2 rounded-full bg-rose-500"></span> {t('status.pending')}</span>;
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{t('status.closed')}</span>;
          })()}
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/customers/${customer.token}`} className="flex-1">
            <Button variant="outline" size="sm" fullWidth className="bg-white">
              {t('common.view', 'View')}
            </Button>
          </Link>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(customer)} className="min-w-[60px] bg-white">
              {t('common.edit', 'Edit')}
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(customer)} className="min-w-[60px] bg-white hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50">
              {t('common.delete', 'Delete')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
