import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { getCacheIgnoreExpiry, setCache, CACHE_KEYS } from '../../lib/cache';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {
  Wallet, ChevronRight, Sunrise, Moon, TrendingUp,
  CreditCard, RefreshCw, Loader2, Droplets, Calendar, Scale
} from 'lucide-react';

// ─── Skeletons ───────────────────────────────────────────
function SkeletonPulse({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div
      className={`rounded-lg bg-slate-100 animate-pulse ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function SkeletonOverview() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-4 w-16" />
      </div>
      <SkeletonPulse className="h-9 w-40 mb-1" />
      <SkeletonPulse className="h-3 w-28 mb-5" />
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
        {[0, 1, 2].map(i => (
          <div key={i}>
            <SkeletonPulse className="h-3 w-12 mb-2" delay={i * 80} />
            <SkeletonPulse className="h-5 w-16" delay={i * 80} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCollection() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
      <SkeletonPulse className="h-5 w-36 mb-5" />
      {[0, 1].map(i => (
        <div key={i} className={`flex items-center gap-3 ${i > 0 ? 'mt-4 pt-4 border-t border-slate-50' : ''}`}>
          <SkeletonPulse className="w-12 h-12 !rounded-2xl" delay={i * 100} />
          <div className="flex-1">
            <SkeletonPulse className="h-4 w-20 mb-2" delay={i * 100} />
            <SkeletonPulse className="h-3 w-32" delay={i * 100} />
          </div>
          <div className="text-right">
            <SkeletonPulse className="h-4 w-14 mb-1" delay={i * 100} />
            <SkeletonPulse className="h-4 w-12" delay={i * 100} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonTrends() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
      <SkeletonPulse className="h-5 w-36 mb-6" />
      <div className="flex items-end justify-between gap-2 h-24">
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <SkeletonPulse
              className="w-full !rounded-xl"
              style={{ height: `${20 + Math.random() * 60}%` } as any}
              delay={i * 60}
            />
            <SkeletonPulse className="h-2.5 w-5" delay={i * 60} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonPayments() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100/80">
      <SkeletonPulse className="h-5 w-36 mb-4" />
      {[0, 1, 2].map(i => (
        <div key={i} className={`flex items-center gap-3 ${i > 0 ? 'mt-4 pt-4 border-t border-slate-50' : ''}`}>
          <SkeletonPulse className="w-10 h-10 !rounded-2xl" delay={i * 100} />
          <div className="flex-1">
            <SkeletonPulse className="h-4 w-28 mb-2" delay={i * 100} />
            <SkeletonPulse className="h-3 w-20" delay={i * 100} />
          </div>
          <SkeletonPulse className="h-5 w-16" delay={i * 100} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────
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
    if (isOffline) { setLoading(false); return; }
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

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  }, [t]);

  const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const morningQty = todayCollection?.morning?.qty || todayCollection?.morning?.quantity_litre || 0;
  const eveningQty = todayCollection?.evening?.qty || todayCollection?.evening?.quantity_litre || 0;

  // Loading
  if (loading && !hasCache) {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <SkeletonPulse className="h-3 w-24 mb-2" />
            <SkeletonPulse className="h-6 w-32" />
          </div>
          <SkeletonPulse className="w-10 h-10 !rounded-full" />
        </div>
        <SkeletonOverview />
        <SkeletonCollection />
        <SkeletonTrends />
        <SkeletonPayments />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* ─── Header ─────────────────────────────── */}
      <div className="flex items-center justify-between"
        style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div>
          <div className="flex items-center gap-1.5">
            <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-slate-400 font-medium">{greeting}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
            {user?.name || 'Customer'}
          </h2>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:shadow-sm active:scale-95 transition-all duration-200"
        >
          {refreshing
            ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            : <RefreshCw className="w-4 h-4" />
          }
        </button>
      </div>

      {/* ─── Overview Card ──────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '50ms' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t('this.month')}</span>
          </div>
          <button
            onClick={() => navigate('/customer/passbook')}
            className="flex items-center gap-0.5 text-indigo-500 text-[11px] font-semibold hover:text-indigo-600 active:scale-95 transition-all"
          >
            {t('view.all')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Amount */}
        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {formatCurrency(dashboardData?.totalAmount || 0)}
        </h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('total.earnings')}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100/80">
          <StatItem
            icon={Droplets}
            gradient="from-cyan-400 to-blue-500"
            label={t('total.milk')}
            value={`${(dashboardData?.totalMilkQty || 0).toFixed(1)}`}
            unit="L"
          />
          <StatItem
            icon={Calendar}
            gradient="from-amber-400 to-orange-500"
            label={t('pouring.days')}
            value={`${dashboardData?.pouringDays || 0}`}
            border
          />
          <StatItem
            icon={Scale}
            gradient="from-emerald-400 to-teal-500"
            label={t('balance')}
            value={formatCurrency(passbookSummary?.balance || 0)}
            isGreen
            border
          />
        </div>
      </div>

      {/* ─── Today's Collection ─────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-bold text-slate-800">{t('today.collection')}</h3>
          <span className="text-[11px] text-slate-300 font-medium bg-slate-50 px-2 py-1 rounded-lg">{todayDate}</span>
        </div>

        {/* Morning */}
        <CollectionRow
          icon={Sunrise}
          gradient="from-amber-400 to-orange-500"
          shadowColor="shadow-amber-500/20"
          label={t('morning')}
          fat={todayCollection?.morning?.fat}
          snf={todayCollection?.morning?.snf}
          qty={morningQty}
          amount={formatCurrency(todayCollection?.morning?.amount || 0)}
          t={t}
        />

        <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent my-4" />

        {/* Evening */}
        <CollectionRow
          icon={Moon}
          gradient="from-indigo-400 to-violet-500"
          shadowColor="shadow-indigo-500/20"
          label={t('evening')}
          fat={todayCollection?.evening?.fat}
          snf={todayCollection?.evening?.snf}
          qty={eveningQty}
          amount={formatCurrency(todayCollection?.evening?.amount || 0)}
          t={t}
        />
      </div>

      {/* ─── Collection Trends ──────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '150ms' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">{t('collection.trends')}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('last.7.days')}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-600">{t('active')}</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-1.5" style={{ height: 100 }}>
          {(trends.length > 0 ? trends.slice(-7) : Array(7).fill({ totalQty: 0 })).map((day: any, i: number) => {
            const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 20);
            const heightPct = ((day.totalQty || 0) / maxQty) * 80;
            const isToday = i === (trends.length > 0 ? trends.slice(-7).length - 1 : -1);
            const dayName = day.date
              ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)
              : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Tooltip on hover */}
                {day.totalQty > 0 && (
                  <span className="text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.totalQty?.toFixed(1)}L
                  </span>
                )}
                <div
                  className={`w-full rounded-xl transition-all duration-500 ${
                    isToday
                      ? 'bg-gradient-to-t from-indigo-500 to-violet-400 shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-100 group-hover:bg-indigo-100'
                  }`}
                  style={{
                    height: `${Math.max(heightPct, 6)}%`,
                    animationDelay: `${i * 60}ms`,
                    animation: 'barGrow 0.6s cubic-bezier(0.16,1,0.3,1) both',
                  }}
                />
                <span className={`text-[9px] font-semibold ${
                  isToday ? 'text-indigo-500' : 'text-slate-300'
                }`}>{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent Payments ────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold text-slate-800">{t('recent.payments')}</h3>
          <button
            onClick={() => navigate('/customer/passbook')}
            className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 active:scale-95 transition-all"
          >
            {t('see.all')}
          </button>
        </div>

        {recentPayments.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-slate-300">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <CreditCard className="w-7 h-7" />
            </div>
            <p className="text-xs font-medium">{t('no.payments')}</p>
          </div>
        ) : (
          recentPayments.map((payment: any, idx: number) => (
            <div
              key={payment.id || idx}
              className={`flex items-center gap-3 group ${
                idx > 0 ? 'mt-3.5 pt-3.5 border-t border-slate-50' : ''
              }`}
              style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${250 + idx * 60}ms` }}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <CreditCard className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800">{t('payment.received')}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(payment.payment_date || payment.date).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-sm font-extrabold text-emerald-600">
                +{formatCurrency(payment.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
      `}</style>
    </div>
  );
}

// ─── Stat Item Component ─────────────────────────────────
function StatItem({ icon: Icon, gradient, label, value, unit, isGreen, border }: {
  icon: any; gradient: string; label: string; value: string; unit?: string; isGreen?: boolean; border?: boolean;
}) {
  return (
    <div className={border ? 'border-l border-slate-100/80 pl-3' : ''}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-4 h-4 rounded flex items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon className="w-2.5 h-2.5 text-white" />
        </div>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-[15px] font-bold ${isGreen ? 'text-emerald-600' : 'text-slate-800'}`}>
        {value}
        {unit && <span className="text-[11px] text-slate-300 font-medium ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

// ─── Collection Row Component ────────────────────────────
function CollectionRow({ icon: Icon, gradient, shadowColor, label, fat, snf, qty, amount, t }: {
  icon: any; gradient: string; shadowColor: string; label: string;
  fat: any; snf: any; qty: number; amount: string; t: (key: string) => string;
}) {
  return (
    <div className="flex items-center gap-3 group">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg ${shadowColor} group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-5.5 h-5.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {t('milk.fat')}: {fat || '—'}% · {t('milk.snf')}: {snf || '—'}%
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[14px] font-extrabold text-slate-800">
          {qty > 0 ? `${qty.toFixed(1)} L` : '— L'}
        </p>
        <p className="text-[13px] font-bold text-emerald-600">{amount}</p>
      </div>
    </div>
  );
}
