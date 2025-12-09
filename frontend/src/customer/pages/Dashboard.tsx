import { useState, useEffect } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { generateDashboardShareMessage, shareNative } from '../utils/shareUtils';
import { Milk, TrendingUp, Calendar, ChevronRight, Droplet, IndianRupee, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function CustomerDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [today, setToday] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize push notifications (auto-registers FCM token)
  usePushNotifications({
    onNotificationReceived: (notification) => {
      console.log('Notification received:', notification);
      // Refresh data when notification is received
      loadData();
    }
  });

  useEffect(() => {
    loadData();

    // Auto-refresh every 15s
    const interval = setInterval(loadData, 15000);

    // Refresh on window focus
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = async () => {
    try {
      const [sumRes, todayRes, payRes, chartRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getPayments({ limit: 3 }),
        customerPortalApi.getLastDaysCollection(10)
      ]);
      setSummary(sumRes.data || {});
      setToday(todayRes.data || {});
      // getPayments returns {payments, pagination}
      setRecentPayments(payRes.data?.payments || []);
      // getLastDaysCollection returns array directly
      setChartData(Array.isArray(chartRes.data) ? chartRes.data : []);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleShare = async () => {
    const message = generateDashboardShareMessage({
      customerName: user?.name || 'Customer',
      customerId: user?.amcuId || String(user?.customerId) || '-',
      todayMorning: today?.morning,
      todayEvening: today?.evening,
      monthlyTotal: summary?.totalMilkQty || 0,
      monthlyAmount: summary?.totalAmount || 0,
      pouringDays: summary?.pouringDays || 0
    });
    
    await shareNative('My Dairy Summary', message);
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium animate-pulse">{t('loading')}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      {/* Welcome & Date */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('dashboard.title')}</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Hero Card - Monthly Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full blur-[60px] opacity-20 -ml-10 -mb-10 pointer-events-none" />

        <div className="relative p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{t('total.earnings')}</p>
              <h3 className="text-4xl font-bold tracking-tight text-white">{formatCurrency(summary?.totalAmount || 0)}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors"
                title="Share Summary"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Milk className="w-4 h-4 text-blue-300" />
                <span className="text-xs text-slate-300">{t('total.milk')}</span>
              </div>
              <p className="text-xl font-bold">{summary?.totalMilkQty?.toFixed(1)} <span className="text-xs font-normal opacity-60">L</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-300" />
                <span className="text-xs text-slate-300">{t('pouring.days')}</span>
              </div>
              <p className="text-xl font-bold">{summary?.pouringDays || 0} <span className="text-xs font-normal opacity-60">{t('pouring.days')}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Collection */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
        <div className="bg-slate-800 px-4 py-3 text-center">
            <h3 className="text-white font-bold text-lg">{t('today.collection')}</h3>
            <p className="text-slate-400 text-xs">{t('last.synced')}: {lastSynced.toLocaleDateString('en-GB')} {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        
        <div className="p-4">
            {/* Header Icons */}
            <div className="grid grid-cols-5 gap-2 mb-4 text-center items-end">
                <div className="col-span-1"></div>
                <div className="flex justify-center pb-1">
                    <Milk className="w-6 h-6 text-indigo-600 stroke-[1.5]" />
                </div>
                <div className="flex flex-col items-center justify-center">
                    <Droplet className="w-5 h-5 text-yellow-500 fill-yellow-100" />
                    <span className="text-[10px] font-bold text-slate-500 mt-1">{t('milk.fat')}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <Droplet className="w-5 h-5 text-lime-500 fill-lime-100" />
                    <span className="text-[10px] font-bold text-slate-500 mt-1">{t('milk.snf')}</span>
                </div>
                <div className="flex justify-center pb-1">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-600 flex items-center justify-center">
                        <IndianRupee className="w-3.5 h-3.5 text-blue-600 font-bold" />
                    </div>
                </div>
            </div>

            {/* Morning Row */}
            <div className="grid grid-cols-5 gap-2 py-3 border-b border-slate-50 items-center text-center">
                <div className="text-sm font-medium text-slate-600 text-left pl-2">{t('morning')}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.morning?.qty?.toFixed(2) || '-'}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.morning?.fat?.toFixed(2) || '-'}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.morning?.snf?.toFixed(2) || '-'}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.morning?.amount?.toFixed(2) || '-'}</div>
            </div>

            {/* Evening Row */}
            <div className="grid grid-cols-5 gap-2 py-3 items-center text-center">
                <div className="text-sm font-medium text-slate-600 text-left pl-2">{t('evening')}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.evening?.qty?.toFixed(2) || '-'}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.evening?.fat?.toFixed(2) || '-'}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.evening?.snf?.toFixed(2) || '-'}</div>
                <div className="font-bold text-slate-800 text-sm">{today?.evening?.amount?.toFixed(2) || '-'}</div>
            </div>
        </div>
      </div>

      {/* Chart - Collection Trends */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        {/* Header with toggle */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{t('collection.trends')}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{t('milk.quantity.time')}</p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setChartPeriod('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartPeriod === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('weekly')}
            </button>
            <button
              onClick={() => setChartPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartPeriod === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('monthly')}
            </button>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return d.toLocaleDateString('en-US', { weekday: 'short' });
                }}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value > 0 ? value : '0'}
                domain={[0, 'auto']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && label) {
                    const d = new Date(label);
                    return (
                      <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                        <p className="font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-slate-300 mt-1">{t('litres')} : <span className="text-white font-bold">{Number(payload[0].value).toFixed(1)}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="totalQty" 
                stroke="#4F46E5" 
                strokeWidth={2.5}
                fill="url(#colorQty)"
                dot={false}
                activeDot={{ 
                  r: 5, 
                  fill: '#fff', 
                  stroke: '#4F46E5', 
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments List */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="font-bold text-slate-800 text-lg">{t('recent.payments')}</h3>
          <Link to="/customer/latest-payments" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition">
             <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">{t('no.data')}</div>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <IndianRupeeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-slate-500 font-medium">{new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {payment.mode}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function IndianRupeeIcon({className}: {className?: string}) {
    return <span className={`font-sans ${className}`}>₹</span>
}
