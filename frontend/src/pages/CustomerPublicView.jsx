import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import PaymentTable from '../components/payments/PaymentTable';
import {
  formatCurrency,
  formatDate,
  formatMobile,
  getInitials,
  getOrdinal,
} from '../utils/formatters';

export default function CustomerPublicView() {
  const { t, i18n } = useTranslation();
  const { linkParam } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/public/customer/${linkParam}`);
        setData(res.data.data || res.data);
      } catch (err) {
        setError(err.response?.data?.message || t('publicView.invalidLink'));
      } finally {
        setLoading(false);
      }
    })();
  }, [linkParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-black tracking-tight text-slate-800">CPAY</h1>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-black tracking-tight text-slate-800">CPAY</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">{t('publicView.linkNotFound')}</h2>
            <p className="text-slate-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { customer, loan, paymentStatus, recentPayments = [] } = data || {};
  const initials = getInitials(customer?.fullName || '');

  // Computed Financials
  const actualPayments = recentPayments.filter(p => !p.isVirtual);
  const pendingItems = recentPayments.filter(p => p.isVirtual && p.status !== 'paid');
  const totalInterestPending = pendingItems.reduce((acc, p) => acc + p.interestPaid, 0);
  const lastPaymentDate = actualPayments.length > 0 ? actualPayments[0].date : null;
  const currentStatus = paymentStatus?.status || 'closed';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">CPAY</h1>
        </div>
        <button
          onClick={() => {
            const newLng = i18n.language === 'en' ? 'hi' : 'en';
            i18n.changeLanguage(newLng);
          }}
          className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          {i18n.language === 'en' ? 'HI' : 'EN'}
        </button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        
        {/* Header Card (Matches Admin Customer Profile) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <span className="text-emerald-400 text-2xl font-black">{initials}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                {linkParam?.split('-')[0] && (
                  <span className="text-xl font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {linkParam.split('-')[0]}
                  </span>
                )}
                {customer?.fullName}
              </h1>
              <p className="text-lg text-slate-600 font-semibold">{formatMobile(customer?.mobileNumber)}</p>
              {customer?.address && <p className="text-slate-600 mt-1">{customer.address}</p>}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('financialSummary.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">{t('financialSummary.totalInterestPaid')}</p>
              <p className="text-xl font-black text-emerald-700">{formatCurrency(loan?.totalInterestPaid || 0)}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">{t('financialSummary.totalInterestPending')}</p>
              <p className="text-xl font-black text-rose-700">{formatCurrency(totalInterestPending)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">{t('financialSummary.totalPrincipalPaid')}</p>
              <p className="text-xl font-black text-blue-700">{formatCurrency(loan?.totalPrincipalPaid || 0)}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">{t('financialSummary.remainingPrincipal')}</p>
              <p className="text-xl font-black text-amber-700">{formatCurrency(loan?.remainingPrincipal || 0)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('financialSummary.monthlyInterest')}</p>
              <p className="text-xl font-black text-slate-800">{formatCurrency(loan?.monthlyInterest || 0)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('financialSummary.totalCollected')}</p>
              <p className="text-xl font-black text-slate-800">{formatCurrency((loan?.totalInterestPaid || 0) + (loan?.totalPrincipalPaid || 0))}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('financialSummary.lastPaymentDate')}</p>
              <p className="text-base font-bold text-slate-800">{lastPaymentDate ? formatDate(lastPaymentDate) : '—'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('financialSummary.nextDueDate')}</p>
              <p className="text-base font-bold text-slate-800">{t('customer.ofEachMonth', { ordinal: getOrdinal(loan?.monthlyDueDay || 1), day: loan?.monthlyDueDay || 1 })}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('financialSummary.currentStatus')}:</span>
            {currentStatus === 'paid' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-100 text-emerald-700"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> {t('status.paid')}</span>}
            {currentStatus === 'due_today' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-orange-100 text-orange-700"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> {t('status.dueToday')}</span>}
            {currentStatus === 'upcoming' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-100 text-blue-700"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> {t('status.upcoming')}</span>}
            {currentStatus === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-100 text-rose-700"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> {t('status.pending')}</span>}
            {currentStatus === 'closed' && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-100 text-slate-700"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> {t('status.closed')}</span>}
          </div>
        </div>

        {/* Need Help Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('publicView.needHelp')}
          </h2>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <span>📞</span> {t('publicView.contactForQueries')}
                </p>
                <p className="ml-6 font-bold text-slate-900 mt-1">6380510770</p>
              </div>
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <span>💰</span> {t('publicView.paymentNumbers')}
                </p>
                <div className="ml-6 mt-1 space-y-1">
                  <p className="font-bold text-slate-900">6380510770</p>
                  <p className="font-bold text-slate-900">6374506827</p>
                </div>
                <p className="ml-6 mt-2 text-xs text-slate-500 italic">
                  {t('publicView.paymentWarning')}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a href="tel:6380510770" className="inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition-colors border border-blue-200 text-sm">
                <span>📞</span> {t('publicView.callNow')}
              </a>
              <a href="https://wa.me/916380510770" target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] font-bold rounded-xl transition-colors border border-[#BBF7D0] text-sm">
                <span>💬</span> {t('publicView.whatsapp')}
              </a>
            </div>
          </div>
        </div>

        {/* Loan Details + Customer Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Details */}
          <Card title={t('customer.loanDetails')}>
            <dl className="space-y-3">
              {[
                { label: t('fields.loanAmount'), value: formatCurrency(loan?.loanAmount) },
                { label: t('fields.interestRate'), value: `${loan?.interestRate || 0}% ${t('customer.perMonth')}` },
                { label: t('fields.loanStartDate'), value: formatDate(loan?.loanStartDate) },
                { label: t('customer.totalPaidPrincipal'), value: formatCurrency((loan?.loanAmount || 0) - (loan?.remainingPrincipal || 0)) },
                { label: t('fields.remainingPrincipal'), value: formatCurrency(loan?.remainingPrincipal) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <dt className="text-sm font-medium text-slate-500">{label}</dt>
                  <dd className="text-sm font-bold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Customer Details */}
          <Card title={t('customer.customerDetails')}>
            <dl className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">{t('common.customer')}</dt>
                <dd className="text-sm font-bold text-slate-800">{customer?.fullName}</dd>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">Customer ID</dt>
                <dd className="text-sm font-mono font-bold text-slate-800">{linkParam?.split('-')[0] || '—'}</dd>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">{t('fields.mobileNumber')}</dt>
                <dd className="text-sm font-bold text-slate-800">{formatMobile(customer?.mobileNumber)}</dd>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-sm font-medium text-slate-500">{t('fields.address')}</dt>
                <dd className="text-sm font-bold text-slate-800 text-right max-w-[60%]">{customer?.address || '—'}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Payment History */}
        <Card
          title={t('fields.paymentHistory')}
          subtitle={t('customer.transactionCount', { count: recentPayments.length })}
          noPad
        >
          <div className="overflow-x-auto">
            <PaymentTable 
              payments={recentPayments} 
              loading={false} 
              readOnly={true}
            />
          </div>
        </Card>
        
        {/* Footer */}
        <footer className="pt-8 pb-4 text-center space-y-2 border-t border-slate-200 mt-8">
          <p className="text-sm font-black text-slate-700 uppercase tracking-widest">{t('publicView.footerTitle')}</p>
          <p className="text-sm text-slate-600 font-medium">{t('publicView.footerThanks')}</p>
          <p className="text-xs text-slate-500">{t('publicView.footerDiscrepancy')}</p>
          <p className="text-xs text-slate-400 mt-4">{t('publicView.lastUpdated')} {new Date().toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </footer>

      </main>
    </div>
  );
}
