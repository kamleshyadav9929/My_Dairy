import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { getCacheIgnoreExpiry, setCache, CACHE_KEYS } from '../../lib/cache';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { 
  Wallet, ChevronRight, Sunrise, Moon, TrendingUp, 
  CreditCard, RefreshCw, Loader2 
} from 'lucide-react';

// === Skeleton Components ===
function SkeletonOverview() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="skeleton h-9 w-40 mb-1" />
      <div className="skeleton h-3 w-28 mb-5" />
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="skeleton h-3 w-14 mb-2" />
            <div className="skeleton h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonTodayCollection() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="skeleton h-5 w-36 mb-5" />
      {[1, 2].map(i => (
        <div key={i} className={`flex items-center gap-3 ${i > 1 ? 'mt-4 pt-4 border-t border-slate-50' : ''}`}>
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-4 w-20 mb-2" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="text-right">
            <div className="skeleton h-4 w-14 mb-1" />
            <div className="skeleton h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTrends() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="skeleton h-5 w-36 mb-4" />
      <div className="flex items-end justify-between gap-2 h-24">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="skeleton w-full rounded-lg" style={{ height: `${20 + Math.random() * 60}%` }} />
            <div className="skeleton h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonPayments() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="skeleton h-5 w-36 mb-4" />
      {[1, 2, 3].map(i => (
        <div key={i} className={`flex items-center gap-3 ${i > 1 ? 'mt-4 pt-4 border-t border-slate-50' : ''}`}>
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-4 w-28 mb-2" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="skeleton h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

// === Main Dashboard ===
export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOffline } = useNetworkStatus();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.DASHBOARD));
  const [todayCollection, setTodayCollection] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.TODAY_COLLECTION));
  const [trends, setTrends] = useState<any[]>(() => getCacheIgnoreExpiry(CACHE_KEYS.TRENDS) || []);
  const [passbookSummary, setPassbookSummary] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.PASSBOOK_SUMMARY));
  const [recentPayments, setRecentPayments] = useState<any[]>(() => getCacheIgnoreExpiry(CACHE_KEYS.RECENT_PAYMENTS) || []);

  const hasCache = !!(dashboardData || todayCollection);

  const fetchData = useCallback(async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }

    try {
      const [summaryRes, todayRes, trendsRes, passbookRes, paymentsRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getLastDaysCollection(7),
        customerPortalApi.getPassbook({ from: '2020-01-01', to: new Date().toISOString().split('T')[0] }),
        customerPortalApi.getPayments({ limit: 3 }),
      ]);
      
      setDashboardData(summaryRes.data);
      setTodayCollection(todayRes.data);
      setTrends(trendsRes.data || []);
      setPassbookSummary(passbookRes.data?.summary || {});
      setRecentPayments(paymentsRes.data?.payments || []);

      // Cache (30 min)
      const ttl = 30 * 60 * 1000;
      setCache(CACHE_KEYS.DASHBOARD, summaryRes.data, ttl);
      setCache(CACHE_KEYS.TODAY_COLLECTION, todayRes.data, ttl);
      setCache(CACHE_KEYS.TRENDS, trendsRes.data || [], ttl);
      setCache(CACHE_KEYS.PASSBOOK_SUMMARY, passbookRes.data?.summary || {}, ttl);
      setCache(CACHE_KEYS.RECENT_PAYMENTS, paymentsRes.data?.payments || [], ttl);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [isOffline]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const formatCurrency = (val: number) =>
    '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  }, [t]);

  const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const morningQty = todayCollection?.morning?.qty || todayCollection?.morning?.quantity_litre || 0;
  const eveningQty = todayCollection?.evening?.qty || todayCollection?.evening?.quantity_litre || 0;

  // Loading skeleton
  if (loading && !hasCache) {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-3 w-24 mb-2" />
            <div className="skeleton h-6 w-32" />
          </div>
          <div className="skeleton w-10 h-10 rounded-full" />
        </div>
        <SkeletonOverview />
        <SkeletonTodayCollection />
        <SkeletonTrends />
        <SkeletonPayments />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Sunrise className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">{greeting}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-0.5">{user?.name || 'Customer'}</h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors tap-scale"
        >
          {refreshing ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <RefreshCw className="w-4.5 h-4.5" />
          )}
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">{t('this.month')}</span>
          </div>
          <button 
            onClick={() => navigate('/customer/passbook')}
            className="flex items-center gap-1 text-indigo-600 text-xs font-medium tap-scale"
          >
            {t('view.all')}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Amount */}
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
          {formatCurrency(dashboardData?.totalAmount || 0)}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{t('total.earnings')}</p>

        {/* Stats footer */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('total.milk')}</p>
            <p className="text-base font-semibold text-slate-800 mt-1">
              {(dashboardData?.totalMilkQty || 0).toFixed(1)} <span className="text-xs text-slate-400 font-normal">L</span>
            </p>
          </div>
          <div className="border-l border-slate-100 pl-4">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('pouring.days')}</p>
            <p className="text-base font-semibold text-slate-800 mt-1">
              {dashboardData?.pouringDays || 0}
            </p>
          </div>
          <div className="border-l border-slate-100 pl-4">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('balance')}</p>
            <p className="text-base font-semibold text-emerald-600 mt-1">
              {formatCurrency(passbookSummary?.balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Collection Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800">{t('today.collection')}</h3>
          <span className="text-xs text-slate-400">{todayDate}</span>
        </div>

        {/* Morning Row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Sunrise className="w-5.5 h-5.5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{t('morning')}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('milk.fat')}: {todayCollection?.morning?.fat || '—'}% · {t('milk.snf')}: {todayCollection?.morning?.snf || '—'}%
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-slate-800">
              {morningQty > 0 ? `${morningQty.toFixed(1)} L` : '— L'}
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(todayCollection?.morning?.amount || 0)}
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-100 my-4" />

        {/* Evening Row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Moon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{t('evening')}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('milk.fat')}: {todayCollection?.evening?.fat || '—'}% · {t('milk.snf')}: {todayCollection?.evening?.snf || '—'}%
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-slate-800">
              {eveningQty > 0 ? `${eveningQty.toFixed(1)} L` : '— L'}
            </p>
            <p className="text-sm font-semibold text-emerald-600">
              {formatCurrency(todayCollection?.evening?.amount || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Collection Trends Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{t('collection.trends')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('last.7.days')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">{t('active')}</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-1.5" style={{ height: 100 }}>
          {(trends.length > 0 ? trends.slice(-7) : Array(7).fill({ totalQty: 0 })).map((day: any, i: number) => {
            const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 20);
            const heightPct = ((day.totalQty || 0) / maxQty) * 80;
            const isToday = i === (trends.length > 0 ? trends.slice(-7).length - 1 : -1);
            const dayName = day.date
              ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)
              : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-lg transition-all ${
                    isToday ? 'bg-indigo-500' : 'bg-indigo-100'
                  }`}
                  style={{ height: `${Math.max(heightPct, 8)}%` }}
                />
                <span className="text-[9px] text-slate-400 font-medium">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Payments Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">{t('recent.payments')}</h3>
          <button 
            onClick={() => navigate('/customer/passbook')}
            className="text-xs font-medium text-indigo-600 tap-scale"
          >
            {t('see.all')}
          </button>
        </div>

        {recentPayments.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-slate-400">
            <CreditCard className="w-8 h-8 mb-2" />
            <p className="text-xs">{t('no.payments')}</p>
          </div>
        ) : (
          recentPayments.map((payment: any, idx: number) => (
            <div
              key={payment.id || idx}
              className={`flex items-center gap-3 ${
                idx > 0 ? 'mt-4 pt-4 border-t border-slate-50' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-[18px] h-[18px] text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{t('payment.received')}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(payment.payment_date || payment.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className="font-bold text-emerald-600">
                +{formatCurrency(payment.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
