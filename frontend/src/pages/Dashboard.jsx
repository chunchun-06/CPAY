import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import StatCard from '../components/dashboard/StatCard';
import RecentPayments from '../components/dashboard/RecentPayments';
import DueList from '../components/dashboard/DueList';
import PendingList from '../components/dashboard/PendingList';
import Card from '../components/ui/Card';
import {
  getStats,
  getMonthlyPendingCustomers,
  getRecentPayments,
} from '../api/dashboardApi';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const statIcons = {
  customers: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  active: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  closed: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  interest: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  principal: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-md">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className="text-blue-600 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [statsRes, pendingRes, recentRes] = await Promise.allSettled([
        getStats(),
        getMonthlyPendingCustomers(),
        getRecentPayments(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        setStats(d.data || d);
        if (d.monthlyChart || d.data?.monthlyChart) {
          setChartData(d.monthlyChart || d.data?.monthlyChart || []);
        } else {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
          setChartData(months.map((m) => ({ month: m, interest: 0 })));
        }
      }
      if (pendingRes.status === 'fulfilled') {
        const d = pendingRes.value.data;
        setPending(d.data || d.customers || d || []);
      }
      if (recentRes.status === 'fulfilled') {
        const d = recentRes.value.data;
        setRecentPayments(d.data || d.payments || d || []);
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
    { label: t('dashboardStats.pendingInterest'), value: formatCurrency(stats?.pendingInterest ?? 0), icon: statIcons.pending, color: 'rose' },
    { label: t('dashboardStats.interestCollected'), value: formatCurrency(stats?.interestCollectedThisMonth ?? 0), icon: statIcons.interest, color: 'emerald' },
    { label: t('dashboardStats.customersPaid'), value: `${stats?.customersPaidThisMonth ?? 0} / ${stats?.activeCustomers ?? 0}`, icon: statIcons.active, color: 'emerald' },
    { label: t('dashboardStats.customersPending'), value: stats?.customersPendingThisMonth ?? '—', icon: statIcons.pending, color: 'rose' },
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

        {/* Monthly Collection Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('dashboardStats.monthlyCollectionProgress')}</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">{t('dashboardStats.customersPaidRatio', { paid: stats?.customersPaidThisMonth ?? 0, total: stats?.activeCustomers ?? 0 })}</p>
            </div>
            <div className="text-3xl font-black text-blue-600">
              {stats?.activeCustomers > 0 ? Math.round(((stats?.customersPaidThisMonth || 0) / stats.activeCustomers) * 100) : 0}%
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${stats?.activeCustomers > 0 ? Math.round(((stats?.customersPaidThisMonth || 0) / stats.activeCustomers) * 100) : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Stat cards */}
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

        {/* Chart + Due Today */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Interest Chart */}
          <Card title={t('dashboardStats.monthlyInterestCollected')} subtitle={t('dashboardStats.last6Months')}>
            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="interest"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    className="opacity-80 hover:opacity-100"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pending Customers List */}
          <Card title={t('dashboardStats.thisMonthPending')} subtitle={`${pending.length} ${t('common.customers')}`}>
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
