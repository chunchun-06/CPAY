import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import StatCard from '../components/dashboard/StatCard';
import RecentPayments from '../components/dashboard/RecentPayments';
import PendingList from '../components/dashboard/PendingList';
import Card from '../components/ui/Card';
import {
  getStats,
  getOverdueCustomers,
  getRecentPayments,
} from '../api/dashboardApi';
import { formatCurrency } from '../utils/formatters';

const statIcons = {
  customers: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  principal: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  revenue: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  collection: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  overdue: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  today: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, pendingRes, recentRes] = await Promise.allSettled([
        getStats(),
        getOverdueCustomers(),
        getRecentPayments(),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data || statsRes.value.data);
      }
      if (pendingRes.status === 'fulfilled') {
        setPending(pendingRes.value.data.data || pendingRes.value.data || []);
      }
      if (recentRes.status === 'fulfilled') {
        setRecentPayments(recentRes.value.data.data || recentRes.value.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/customers?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const statList = [
    { label: t('dashboardStats.totalCustomers'), value: stats?.totalCustomers ?? '—', icon: statIcons.customers, color: 'blue' },
    { label: t('dashboardStats.outstandingPrincipal'), value: formatCurrency(stats?.outstandingPrincipal ?? 0), icon: statIcons.principal, color: 'amber' },
    { label: t('dashboardStats.totalRevenueEarned'), value: formatCurrency(stats?.totalRevenueEarned ?? 0), icon: statIcons.revenue, color: 'emerald' },
    { label: t('dashboardStats.totalCollectedThisMonth'), value: formatCurrency(stats?.totalCollectedThisMonth ?? 0), icon: statIcons.collection, color: 'blue' },
    { label: t('dashboardStats.totalInterestPending'), value: formatCurrency(stats?.pendingInterest ?? 0), icon: statIcons.pending, color: 'rose' },
    { label: t('dashboardStats.customersPaidThisMonth'), value: `${stats?.customersPaidThisMonth ?? 0} / ${stats?.activeCustomers ?? 0}`, icon: statIcons.collection, color: 'emerald' },
    { label: t('dashboardStats.customersPendingThisMonth'), value: stats?.customersPendingThisMonth ?? '—', icon: statIcons.pending, color: 'rose' },
    { label: t('dashboardStats.overdueCustomers'), value: stats?.overdueCustomers ?? '—', icon: statIcons.overdue, color: 'rose' },
    { label: t('dashboardStats.todaysDueCustomers'), value: stats?.todaysDueCustomers ?? '—', icon: statIcons.today, color: 'amber' },
  ];

  return (
    <Layout pageTitle={t('common.dashboard')}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Quick search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('dashboardStats.quickSearch')}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm min-h-[48px] shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors min-h-[48px] text-sm shadow-sm"
          >
            {t('common.search')}
          </button>
        </form>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statList.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              color={s.color}
              loading={loading}
            />
          ))}
        </div>

        {/* Monthly Collection & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Collection Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{t('dashboardStats.monthlyCollection')}</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {t('dashboardStats.customersPaidDesc', { paid: stats?.customersPaidThisMonth ?? 0, total: stats?.activeCustomers ?? 0 })}
                  </p>
                </div>
                <div className="text-3xl font-black text-blue-600">
                  {stats?.activeCustomers > 0 ? Math.round(((stats?.customersPaidThisMonth || 0) / stats.activeCustomers) * 100) : 0}%
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mb-6">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.activeCustomers > 0 ? Math.round(((stats?.customersPaidThisMonth || 0) / stats.activeCustomers) * 100) : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">{t('dashboardStats.interestCollectedLabel')}</p>
                <p className="text-xl font-black text-emerald-700">{formatCurrency(stats?.revenueThisMonth ?? 0)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">{t('dashboardStats.principalCollected')}</p>
                <p className="text-xl font-black text-blue-700">{formatCurrency(stats?.principalCollectedThisMonth ?? 0)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 col-span-2 flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('dashboardStats.totalCollectionThisMonth')}</p>
                  <p className="text-2xl font-black text-slate-800">{formatCurrency(stats?.totalCollectedThisMonth ?? 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('dashboardStats.monthlyRevenue')}</p>
                  <p className="text-lg font-black text-emerald-600">{formatCurrency(stats?.revenueThisMonth ?? 0)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Trend Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-5">{t('dashboardStats.analytics')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-1">{t('dashboardStats.revenueThisMonth')}</p>
                  <p className="text-xl font-black text-slate-800">{formatCurrency(stats?.revenueThisMonth ?? 0)}</p>
                </div>
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-1">{t('dashboardStats.revenueLastMonth')}</p>
                  <p className="text-xl font-black text-slate-800">{formatCurrency(stats?.revenueLastMonth ?? 0)}</p>
                </div>
              </div>
              
              <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                <p className="text-sm font-semibold text-slate-600">{t('dashboardStats.revenueGrowth')}</p>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${(stats?.revenueDifferencePercent ?? 0) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {(stats?.revenueDifferencePercent ?? 0) > 0 ? '+' : ''}{stats?.revenueDifferencePercent ?? 0}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">{t('dashboardStats.newCustomers')}</p>
                  <p className="text-xl font-black text-blue-600">+{stats?.newCustomersThisMonth ?? 0}</p>
                </div>
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">{t('dashboardStats.paymentsRecorded')}</p>
                  <p className="text-xl font-black text-blue-600">+{stats?.paymentsRecordedThisMonth ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Widgets row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={t('dashboardStats.overdueCustomers')} subtitle={`${pending.length} ${t('common.customers')}`}>
            <PendingList items={pending} loading={loading} />
          </Card>

          <Card title={t('dashboardStats.recentPayments')} subtitle={t('dashboardStats.latestTransactions')}>
            <RecentPayments payments={recentPayments} loading={loading} />
          </Card>
        </div>
      </div>
    </Layout>
  );
}
