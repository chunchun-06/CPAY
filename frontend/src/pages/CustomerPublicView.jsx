import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { formatCurrency, formatDate, formatMobile, getInitials, getOrdinal } from '../utils/formatters';
import Spinner from '../components/ui/Spinner';
import { useTranslation } from 'react-i18next';

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
      <div className="min-h-screen bg-[#F6F8F5] flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F6F8F5] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('publicView.linkNotFound')}</h2>
          <p className="text-slate-600 text-sm">{error}</p>
          <p className="text-slate-400 text-xs mt-6 font-bold uppercase tracking-widest">{t('publicView.contactQueries')}</p>
        </div>
      </div>
    );
  }

  const { customer, loan, paymentStatus, recentPayments = [] } = data || {};
  const isLoanActive = loan?.status === 'active';

  return (
    <div className="min-h-screen bg-[#F6F8F5] font-sans text-slate-900 selection:bg-emerald-200">
      {/* Navbar */}
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tighter uppercase">CPAY*</h1>
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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12 animate-fade-in">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Verified Account
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
            {customer?.fullName}
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 font-medium">
            Customer ID: <span className="text-slate-900 font-mono font-bold bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">{linkParam?.split('-')[0] || '—'}</span>
          </p>
        </div>

        {/* Spade-style Metric Cards */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Remaining Principal */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center text-amber-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('fields.remainingPrincipal')}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{t('fields.loanStartDate')}: {formatDate(loan?.loanStartDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight text-slate-900">{formatCurrency(loan?.remainingPrincipal ?? 0)}</p>
                </div>
              </div>
              <div className="bg-[#FFF8EB] px-6 py-4 flex items-center justify-between border-t border-amber-100/50">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> {t('status.active')}
                </span>
                <span className="text-sm font-bold text-amber-900">{loan?.interestRate}% {t('customer.perMonth')}</span>
              </div>
            </div>

            {/* Card 2: Monthly Interest */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('fields.monthlyInterest')}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{t('fields.nextDueDate')}: {isLoanActive ? t('customer.ofEachMonth', { ordinal: getOrdinal(loan?.monthlyDueDay || 1), day: loan?.monthlyDueDay || 1 }) : '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight text-slate-900">{formatCurrency(loan?.monthlyInterest ?? 0)}</p>
                </div>
              </div>
              {(() => {
                const s = isLoanActive ? paymentStatus?.status : 'closed';
                let bg = 'bg-slate-50', border = 'border-slate-100', text = 'text-slate-700', dot = 'bg-slate-400', label = t(`status.${s}`);
                if (s === 'paid') { bg = 'bg-[#F2FCF5]'; border = 'border-emerald-100'; text = 'text-emerald-800'; dot = 'bg-emerald-500'; }
                if (s === 'upcoming') { bg = 'bg-[#FFF8EB]'; border = 'border-amber-100'; text = 'text-amber-800'; dot = 'bg-amber-500'; }
                if (s === 'pending') { bg = 'bg-[#FFF1F2]'; border = 'border-rose-100'; text = 'text-rose-800'; dot = 'bg-rose-500'; }
                if (s === 'overdue') { bg = 'bg-slate-900'; border = 'border-slate-800'; text = 'text-white'; dot = 'bg-white'; }
                
                return (
                  <div className={`${bg} px-6 py-4 flex items-center justify-between border-t ${border}`}>
                    <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${text}`}>
                      <span className={`w-2 h-2 rounded-full ${dot}`}></span> {t('publicView.currentStatus')}
                    </span>
                    <span className={`text-sm font-bold ${text}`}>{label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Card 3: Total Paid */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col md:col-span-2 lg:col-span-1">
              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-700">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payments</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Principal + Interest</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tracking-tight text-slate-900">{formatCurrency((loan?.totalPrincipalPaid || 0) + (loan?.totalInterestPaid || 0))}</p>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{t('publicView.totalPrincipalPaid')}</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(loan?.totalPrincipalPaid ?? 0)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* SPADE-style Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{t('customer.loanDetails')}</h3>
            <div className="space-y-4">
              {[
                { label: t('fields.loanAmount'), value: formatCurrency(loan?.loanAmount) },
                { label: t('fields.interestRate'), value: `${loan?.interestRate || 0}% ${t('customer.perMonth')}` },
                { label: t('fields.loanStartDate'), value: formatDate(loan?.loanStartDate) },
                { label: t('customer.totalPaidPrincipal'), value: formatCurrency(loan?.totalPrincipalPaid ?? 0) },
                { label: t('fields.remainingPrincipal'), value: formatCurrency(loan?.remainingPrincipal ?? 0) },
              ].map(({ label, value }, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-slate-400">{label}</span>
                  <span className="text-sm font-black text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{t('customer.customerDetails')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-400">{t('fields.mobileNumber')}</span>
                <span className="text-sm font-black text-slate-900">{formatMobile(customer?.mobileNumber)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-400">{t('fields.address')}</span>
                <span className="text-sm font-black text-slate-900 text-right max-w-[60%] truncate">{customer?.address || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-bold text-slate-400">CUSTOMER ID</span>
                <span className="text-sm font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{linkParam?.split('-')[0] || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Payment History Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{t('fields.paymentHistory')}</h3>
          </div>
          
          <div className="overflow-x-auto w-full">
            {recentPayments.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-400 font-medium">{t('payment.noPayments')}</p>
              </div>
            ) : (
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('fields.date')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('fields.interestPaid')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('fields.principalPaid')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('fields.totalPaid')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('fields.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((p, i) => (
                    <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${p.isVirtual ? 'opacity-70 bg-slate-50/30' : ''}`}>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900">{formatDate(p.date)}</p>
                        {p.remarks && <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate">{p.remarks}</p>}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-black text-emerald-700">{formatCurrency(p.interestPaid)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-black text-blue-700">{formatCurrency(p.principalPaid)}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-base font-black text-slate-900">{formatCurrency(p.totalAmount)}</span>
                        <p className="text-xs text-slate-500 font-mono mt-1">Bal: {formatCurrency(p.remainingPrincipal)}</p>
                      </td>
                      <td className="px-6 py-5">
                        {(() => {
                          if (!p.isVirtual) return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-emerald-100 text-emerald-800">{t('status.paid')}</span>;
                          if (p.status === 'pending') return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-rose-100 text-rose-800">{t('status.overdue')}</span>;
                          return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-amber-100 text-amber-800">{t('status.pending')}</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 pb-8 text-center space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('publicView.readOnlyStatement')}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t('publicView.contactQueries')}</p>
        </footer>

      </main>
    </div>
  );
}
