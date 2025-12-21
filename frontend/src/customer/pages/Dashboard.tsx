import { useState, useEffect, useCallback, useRef } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { getCacheIgnoreExpiry, setCache, CACHE_KEYS } from '../../lib/cache';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

import { 
  Milk, TrendingUp, Calendar, ChevronRight, IndianRupee,
  Sun, Moon, Sunrise, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { usePushNotifications } from '../../hooks/usePushNotifications';

// Skeleton Components
function SkeletonHero() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-10 w-40 mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-20 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonTodayCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="skeleton h-5 w-32 mb-4" />
      <div className="space-y-3">
        <div className="skeleton h-16 rounded-xl" />
        <div className="skeleton h-16 rounded-xl" />
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [summary, setSummary] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.DASHBOARD_SUMMARY));
  const [today, setToday] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.DASHBOARD_TODAY));
  const [recentPayments, setRecentPayments] = useState<any[]>(() => getCacheIgnoreExpiry(CACHE_KEYS.DASHBOARD_PAYMENTS) || []);
  const [chartData, setChartData] = useState<any[]>(() => getCacheIgnoreExpiry(CACHE_KEYS.DASHBOARD_CHART) || []);
  const [isLoading, setIsLoading] = useState(() => !getCacheIgnoreExpiry(CACHE_KEYS.DASHBOARD_SUMMARY));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const isPulling = useRef(false);

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: () => loadData()
  });

  const loadData = useCallback(async (showRefresh = false) => {
    if (isOffline) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    
    try {
      if (showRefresh) setIsRefreshing(true);
      
      const [sumRes, todayRes, payRes, chartRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getPayments({ limit: 3 }),
        customerPortalApi.getLastDaysCollection(7)
      ]);
      
      const summaryData = sumRes.data || {};
      const todayData = todayRes.data || {};
      const paymentsData = payRes.data?.payments || [];
      const chartDataRes = Array.isArray(chartRes.data) ? chartRes.data : [];
      
      // Update state
      setSummary(summaryData);
      setToday(todayData);
      setRecentPayments(paymentsData);
      setChartData(chartDataRes);
      
      // Cache data for 30 minutes
      setCache(CACHE_KEYS.DASHBOARD_SUMMARY, summaryData, 30 * 60 * 1000);
      setCache(CACHE_KEYS.DASHBOARD_TODAY, todayData, 30 * 60 * 1000);
      setCache(CACHE_KEYS.DASHBOARD_PAYMENTS, paymentsData, 30 * 60 * 1000);
      setCache(CACHE_KEYS.DASHBOARD_CHART, chartDataRes, 30 * 60 * 1000);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOffline]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000); // Refresh every 30s
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const pullDistance = e.touches[0].clientY - pullStartY.current;
    if (pullDistance > 80 && window.scrollY === 0 && !isRefreshing) {
      loadData(true);
      isPulling.current = false;
    }
  };

  const handleTouchEnd = () => {
    isPulling.current = false;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('greeting.morning'), icon: Sunrise };
    if (hour < 17) return { text: t('greeting.afternoon'), icon: Sun };
    return { text: t('greeting.evening'), icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Loading State with Skeletons
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {/* Greeting Skeleton */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-7 w-36" />
          </div>
          <div className="skeleton w-12 h-12 rounded-2xl" />
        </div>
        <SkeletonHero />
        <SkeletonTodayCard />
      </div>
    );
  }

  return (
    <div 
      className="space-y-5 pb-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">{greeting.text}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">
            {user?.name || 'Customer'}
          </h1>
        </div>
        <button 
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hero Card - Monthly Earnings with Premium Background */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        />
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-emerald-900/60" />
        
        {/* Glassmorphism content container */}
        <div className="relative p-5">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
            {t('total.earnings')}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-5 drop-shadow-lg">
            {formatCurrency(summary?.totalAmount || 0)}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Milk className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-white/70 font-medium">{t('total.milk')}</span>
              </div>
              <p className="text-2xl font-bold text-white">{summary?.totalMilkQty?.toFixed(1) || '0'}<span className="text-lg font-normal ml-1">L</span></p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-white/70 font-medium">{t('pouring.days')}</span>
              </div>
              <p className="text-2xl font-bold text-white">{summary?.pouringDays || 0}<span className="text-lg font-normal ml-1">days</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Collection - Simplified */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden card-press">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{t('today.collection')}</h3>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        
        <div className="divide-y divide-slate-50">
          {/* Morning Row */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Sunrise className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t('morning')}</p>
                <p className="text-xs text-slate-400">
                  {today?.morning?.qty > 0 
                    ? `Fat: ${today?.morning?.fat?.toFixed(1) || '-'}% • SNF: ${today?.morning?.snf?.toFixed(1) || '-'}%` 
                    : 'No entry yet'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {today?.morning?.qty > 0 ? (
                <>
                  <p className="font-bold text-slate-800">{today?.morning?.qty?.toFixed(1)} L</p>
                  <p className="text-sm font-semibold text-emerald-600">₹{today?.morning?.amount?.toFixed(0)}</p>
                </>
              ) : (
                <span className="text-sm text-slate-300">—</span>
              )}
            </div>
          </div>

          {/* Evening Row */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Moon className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t('evening')}</p>
                <p className="text-xs text-slate-400">
                  {today?.evening?.qty > 0 
                    ? `Fat: ${today?.evening?.fat?.toFixed(1) || '-'}% • SNF: ${today?.evening?.snf?.toFixed(1) || '-'}%` 
                    : 'No entry yet'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {today?.evening?.qty > 0 ? (
                <>
                  <p className="font-bold text-slate-800">{today?.evening?.qty?.toFixed(1)} L</p>
                  <p className="text-sm font-semibold text-emerald-600">₹{today?.evening?.amount?.toFixed(0)}</p>
                </>
              ) : (
                <span className="text-sm text-slate-300">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 card-press">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800">{t('collection.trends')}</h3>
            <p className="text-xs text-slate-400">Last 7 days</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Active</span>
          </div>
        </div>
        
        <div className="h-36">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => value > 0 ? `${value}` : ''}
                  width={35}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length && label) {
                      return (
                        <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                          <p className="font-medium">{new Date(label).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</p>
                          <p className="text-indigo-300">{Number(payload[0].value).toFixed(1)} L</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="totalQty" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                >
                {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? '#4F46E5' : '#E0E7FF'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">{t('recent.payments')}</h3>
          <Link to="/customer/latest-payments" className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {recentPayments.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <IndianRupee className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">{t('no.data')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase">
                  {payment.mode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
