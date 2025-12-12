import { useState, useEffect } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { generateDashboardShareMessage, shareNative } from '../utils/shareUtils';
import { 
  Milk, TrendingUp, Calendar, ChevronRight, Droplet, IndianRupee, Share2,
  BookOpen, Download, Phone, Sun, Moon, Sunrise
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function CustomerDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [today, setToday] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize push notifications
  usePushNotifications({
    onNotificationReceived: () => loadData()
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    const handleFocus = () => loadData();
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
        customerPortalApi.getLastDaysCollection(7)
      ]);
      setSummary(sumRes.data || {});
      setToday(todayRes.data || {});
      setRecentPayments(payRes.data?.payments || []);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('greeting.morning') || 'Good Morning', icon: Sunrise, color: 'text-amber-500' };
    if (hour < 17) return { text: t('greeting.afternoon') || 'Good Afternoon', icon: Sun, color: 'text-orange-500' };
    return { text: t('greeting.evening') || 'Good Evening', icon: Moon, color: 'text-indigo-400' };
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

  const handleDownloadPDF = () => {
    // Navigate to passbook with download intent
    window.location.href = '/customer/passbook?download=true';
  };

  const handleContactDairy = () => {
    // You can set the dairy owner's phone number in settings
    const dairyPhone = '9876543210'; // Replace with actual or fetch from settings
    window.location.href = `tel:${dairyPhone}`;
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  if (isLoading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-white/30 animate-spin" />
      </div>
      <p className="text-slate-400 text-sm font-medium mt-4 animate-pulse">{t('loading')}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon className={`w-5 h-5 ${greeting.color}`} />
            <span className="text-sm font-medium text-slate-500">{greeting.text}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {user?.name || 'Customer'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
          {(user?.name || 'C').charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Hero Card - Monthly Earnings */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-30 -mr-10 -mt-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-[50px] opacity-25 -ml-8 -mb-8" />
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-400 rounded-full blur-[40px] opacity-20 transform -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{t('total.earnings') || 'This Month'}</p>
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                {formatCurrency(summary?.totalAmount || 0)}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Milk className="w-4 h-4 text-blue-300" />
                </div>
              </div>
              <p className="text-2xl font-bold">{summary?.totalMilkQty?.toFixed(1) || '0'}</p>
              <p className="text-xs text-slate-400 mt-1">{t('total.milk') || 'Total Litres'}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-300" />
                </div>
              </div>
              <p className="text-2xl font-bold">{summary?.pouringDays || 0}</p>
              <p className="text-xs text-slate-400 mt-1">{t('pouring.days') || 'Pouring Days'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-3">
        <Link to="/customer/passbook" className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md hover:border-indigo-100 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-600">{t('passbook') || 'Passbook'}</span>
          </div>
        </Link>
        
        <button onClick={handleDownloadPDF} className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md hover:border-emerald-100 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-600">{t('download') || 'Download'}</span>
          </div>
        </button>
        
        <button onClick={handleShare} className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md hover:border-blue-100 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-600">{t('share') || 'Share'}</span>
          </div>
        </button>
        
        <button onClick={handleContactDairy} className="group">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md hover:border-orange-100 transition-all hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-600">{t('contact') || 'Contact'}</span>
          </div>
        </button>
      </div>

      {/* Today's Collection */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-base">{t('today.collection') || "Today's Collection"}</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {t('last.synced') || 'Last synced'}: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button onClick={loadData} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {/* Header */}
          <div className="grid grid-cols-5 gap-2 mb-3 text-center">
            <div></div>
            <div className="flex flex-col items-center">
              <Milk className="w-5 h-5 text-indigo-500 mb-1" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Qty</span>
            </div>
            <div className="flex flex-col items-center">
              <Droplet className="w-5 h-5 text-amber-500 fill-amber-100 mb-1" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">{t('milk.fat') || 'Fat'}</span>
            </div>
            <div className="flex flex-col items-center">
              <Droplet className="w-5 h-5 text-lime-500 fill-lime-100 mb-1" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase">{t('milk.snf') || 'SNF'}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center mb-1">
                <IndianRupee className="w-3 h-3 text-emerald-500" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Amt</span>
            </div>
          </div>

          {/* Morning Row */}
          <div className="grid grid-cols-5 gap-2 py-3 items-center text-center bg-gradient-to-r from-amber-50 to-transparent rounded-xl mb-2">
            <div className="flex items-center gap-2 pl-3">
              <Sunrise className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-slate-700">{t('morning') || 'AM'}</span>
            </div>
            <div className="font-bold text-slate-800">{today?.morning?.qty?.toFixed(1) || '-'}</div>
            <div className="font-bold text-amber-600">{today?.morning?.fat?.toFixed(1) || '-'}</div>
            <div className="font-bold text-lime-600">{today?.morning?.snf?.toFixed(1) || '-'}</div>
            <div className="font-bold text-emerald-600">₹{today?.morning?.amount?.toFixed(0) || '-'}</div>
          </div>

          {/* Evening Row */}
          <div className="grid grid-cols-5 gap-2 py-3 items-center text-center bg-gradient-to-r from-indigo-50 to-transparent rounded-xl">
            <div className="flex items-center gap-2 pl-3">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">{t('evening') || 'PM'}</span>
            </div>
            <div className="font-bold text-slate-800">{today?.evening?.qty?.toFixed(1) || '-'}</div>
            <div className="font-bold text-amber-600">{today?.evening?.fat?.toFixed(1) || '-'}</div>
            <div className="font-bold text-lime-600">{today?.evening?.snf?.toFixed(1) || '-'}</div>
            <div className="font-bold text-emerald-600">₹{today?.evening?.amount?.toFixed(0) || '-'}</div>
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800">{t('collection.trends') || 'Collection Trends'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('milk.quantity.time') || 'Last 7 days'}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Active</span>
          </div>
        </div>
        
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQtyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value > 0 ? `${value}L` : '0'}
                domain={[0, 'auto']}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && label) {
                    return (
                      <div className="bg-slate-800 text-white px-3 py-2 rounded-xl shadow-xl text-sm">
                        <p className="font-medium">{new Date(label).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</p>
                        <p className="text-indigo-300 mt-1">{Number(payload[0].value).toFixed(1)} L</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalQty" 
                stroke="#6366F1" 
                strokeWidth={2.5}
                fill="url(#colorQtyGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#fff', stroke: '#6366F1', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-slate-800">{t('recent.payments') || 'Recent Payments'}</h3>
          <Link to="/customer/latest-payments" className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {recentPayments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <IndianRupee className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">{t('no.data') || 'No payments yet'}</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex-shrink-0 w-40 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm snap-start">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-100">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                <span className="inline-block mt-2 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
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
