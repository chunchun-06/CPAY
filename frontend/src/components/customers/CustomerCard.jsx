import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatCurrency, formatMobile, getInitials, formatDate, getOrdinal } from '../../utils/formatters';

export default function CustomerCard({ customer, onDelete, onEdit }) {
  const { t } = useTranslation();
  const loan = customer.loan || {};
  const initials = getInitials(customer.fullName);

  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300 animate-fade-in flex flex-col h-full">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center shrink-0 border border-blue-500/20">
          <span className="text-blue-600 text-base font-bold">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-bold text-slate-800 truncate" title={customer.fullName}>
              {customer.fullName}
            </h3>
          </div>
          <p className="text-sm font-medium text-slate-500">{formatMobile(customer.mobileNumber)}</p>
        </div>
      </div>

      {/* Extended Stats */}
      <div className="flex-1 space-y-3 mb-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('fields.loanAmount')}</p>
            <p className="text-sm font-bold text-slate-800">{formatCurrency(loan.loanAmount ?? 0)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-emerald-600/80 uppercase tracking-wider mb-1">{t('fields.remainingPrincipal')}</p>
            <p className="text-sm font-bold text-emerald-600">
              {formatCurrency(loan.remainingPrincipal ?? loan.loanAmount ?? 0)}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('fields.interestRate')}</p>
            <p className="text-sm font-bold text-slate-800">{loan.interestRate || 0}% / {t('common.month')}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('fields.monthlyInterest')}</p>
            <p className="text-sm font-bold text-slate-800">
              {formatCurrency(loan.monthlyInterest ?? 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('fields.loanStartDate')}</p>
            <p className="text-sm font-bold text-slate-800">{formatDate(loan.loanStartDate)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-600/80 uppercase tracking-wider mb-1">{t('fields.nextDueDate')}</p>
            <p className="text-sm font-bold text-amber-600">
              {t('customer.ordinalOfMonth', { ordinal: getOrdinal(loan.monthlyDueDay || 1) })}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
        <Link to={`/customers/${customer.token}`} className="flex-1">
          <Button variant="primary" size="sm" fullWidth>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {t('common.view')}
          </Button>
        </Link>
        {onEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(customer)}
            className="min-w-[44px]"
            title={t('common.editCustomer')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(customer)}
            className="min-w-[44px] hover:text-rose-500 hover:bg-rose-50 border-transparent hover:border-rose-200"
            title={t('common.deleteCustomer')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}
