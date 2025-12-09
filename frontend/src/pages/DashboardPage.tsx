import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { entryApi, customerApi, paymentApi } from '../lib/api';
import { motion } from 'framer-motion';
import { 
  Milk, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Calendar,
  Plus,
  ArrowRight,
  RefreshCw,
  Award,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

interface TodayStats {
  totalLitres: number;
  totalAmount: number;
  entryCount: number;
  morningLitres: number;
  eveningLitres: number;
}

interface RecentEntry {
  id: number;
  customer_name: string;
  amcu_customer_id: string;
  quantity_litre: number;
  amount: number;
  shift: string;
  milk_type: string;
  created_at: string;
}

interface TopCustomer {
  id: number;
  name: string;
  amcu_customer_id: string;
  total_milk_amount: number;
  balance: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [monthlyPayments, setMonthlyPayments] = useState(0);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [weeklyData, setWeeklyData] = useState<{day: string, litres: number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{day: string, litres: number}[]>([]);
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    const handleFocus = () => loadDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const loadDashboardData = async () => {
    try {
      if (!isLoading) setIsRefreshing(true);
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
      });

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
      });

      const [todayRes, customersRes, paymentsRes, allCustomersRes, weeklyRes, monthlyRes] = await Promise.all([
        entryApi.getToday({ date: getLocalDate() }),
        customerApi.getAll({ limit: 1 }),
        paymentApi.getAll({ 
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          to: getLocalDate()
        }),
        customerApi.getAll({ limit: 100 }),
        entryApi.getAll({ from: last7Days[0], to: last7Days[6] }),
        entryApi.getAll({ from: last30Days[0], to: last30Days[29] })
      ]);

      setTodayStats(todayRes.data.stats);
      setRecentEntries(todayRes.data.entries || []);
      setCustomerCount(customersRes.data.pagination?.total || 0);
      setMonthlyPayments(paymentsRes.data.payments?.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0) || 0);
      
      const allCustomers = allCustomersRes.data.customers || [];
      const sortedByMilk = [...allCustomers].sort((a: TopCustomer, b: TopCustomer) => 
        (b.total_milk_amount || 0) - (a.total_milk_amount || 0)
      );
      setTopCustomers(sortedByMilk.slice(0, 5));
      
      const entries = weeklyRes.data.entries || [];
      const weeklyAgg = last7Days.map(date => {
        const dayEntries = entries.filter((e: { date: string }) => e.date === date);
        const litres = dayEntries.reduce((sum: number, e: { quantity_litre: number }) => sum + (e.quantity_litre || 0), 0);
        const dayName = new Date(date).toLocaleDateString('en-IN', { weekday: 'short' });
        return { day: dayName, litres: Math.round(litres * 10) / 10, date };
      });
      setWeeklyData(weeklyAgg);

      const monthlyEntries = monthlyRes.data.entries || [];
      const monthlyAgg = last30Days.map(date => {
        const dayEntries = monthlyEntries.filter((e: { date: string }) => e.date === date);
        const litres = dayEntries.reduce((sum: number, e: { quantity_litre: number }) => sum + (e.quantity_litre || 0), 0);
        const dayNum = new Date(date).getDate().toString();
        return { day: dayNum, litres: Math.round(litres * 10) / 10, date };
      });
      setMonthlyData(monthlyAgg);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 pb-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="capitalize">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Active
          </div>
          <button 
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-700 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { 
            title: "New Entry", 
            desc: "Record milk collection", 
            icon: Plus, 
            color: "indigo", 
            path: "/entries",
            gradient: "from-indigo-500 to-violet-600"
          },
          { 
            title: "Add Customer", 
            desc: "Register new supplier", 
            icon: Users, 
            color: "amber", 
            path: "/customers",
            gradient: "from-amber-400 to-orange-500"
          },
          { 
            title: "Add Payment", 
            desc: "Record transaction", 
            icon: CreditCard, 
            color: "emerald", 
            path: "/payments",
            gradient: "from-emerald-400 to-teal-500"
          }
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => navigate(action.path)}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
          >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
              <action.icon className={`w-24 h-24 text-${action.color}-500`} />
            </div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-lg`}>
                <action.icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-heading font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{action.title}</h3>
                <p className="text-sm text-slate-500">{action.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: "Today's Milk", 
            value: `${todayStats?.totalLitres?.toFixed(1) || 0}L`, 
            subValue: "Collected",
            icon: Milk,
            color: "blue",
            trend: todayStats?.entryCount || 0,
            trendLabel: "entries"
          },
          { 
            label: "Expected Revenue", 
            value: formatCurrency(todayStats?.totalAmount || 0), 
            subValue: "Today",
            icon: TrendingUp,
            color: "emerald",
            trend: "100%",
            trendLabel: "payment rate"
          },
          { 
            label: "Active Customers", 
            value: customerCount, 
            subValue: "Suppliers",
            icon: Users,
            color: "amber",
            trend: "Verified",
            trendLabel: "accounts"
          },
          { 
            label: "Monthly Disbursed", 
            value: formatCurrency(monthlyPayments), 
            subValue: "This Month",
            icon: CreditCard, 
            color: "purple",
            trend: "Paid",
            trendLabel: "securely"
          }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            className="glass-card p-5 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700 uppercase tracking-widest opacity-80`}>
                {stat.subValue}
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">{stat.label}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className={`flex items-center gap-1 text-${stat.color}-600 bg-${stat.color}-50 px-1.5 py-0.5 rounded`}>
                {stat.trend}
              </span>
              <span>{stat.trendLabel}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">Collection Trends</h3>
              <p className="text-sm text-slate-500">Milk quantity over time</p>
            </div>
            <div className="flex bg-slate-100/80 p-1 rounded-xl">
              {['weekly', 'monthly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view as 'weekly' | 'monthly')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    chartView === view 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartView === 'weekly' ? weeklyData : monthlyData}>
                <defs>
                  <linearGradient id="colorLitres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  interval={chartView === 'monthly' ? 4 : 0}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: 'white', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="litres" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLitres)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top Suppliers
            </h3>
            <button onClick={() => navigate('/customers')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">View All</button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {topCustomers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">No supplier data yet</p>
              </div>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className={`relative w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20' : 
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/20' : 
                    index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 shadow-amber-900/20' : 
                    'bg-slate-100 text-slate-500 shadow-none'
                  }`}>
                    {index + 1}
                    {index < 3 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center text-[8px] text-amber-500">★</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{customer.name}</p>
                    <p className="text-xs text-slate-400 font-mono">ID: {customer.amcu_customer_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{customer.total_milk_amount?.toFixed(0) || 0}<span className="text-xs text-slate-400 ml-0.5">L</span></p>
                    <div className="h-1 w-16 bg-slate-100 rounded-full mt-1 ml-auto overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.min((customer.total_milk_amount / (topCustomers[0]?.total_milk_amount || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/50">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">Recent Collections</h3>
            <p className="text-sm text-slate-500">Latest milk entries from today</p>
          </div>
          <button 
            onClick={() => navigate('/entries')} 
            className="group flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            View All Entries 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentEntries.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
                <Milk className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-medium">No activity today</p>
              <p className="text-slate-500 text-sm mt-1 mb-6 max-w-xs mx-auto">Start recording milk collections to see data populate in real-time.</p>
              <button 
                onClick={() => navigate('/entries')}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                Record Entry
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Shift</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Quantity</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 text-slate-500 text-sm font-mono">
                      {entry.created_at ? new Date(entry.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          ['bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600'][entry.id % 4]
                        }`}>
                          {entry.customer_name?.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold text-sm group-hover:text-indigo-600 transition-colors">{entry.customer_name}</p>
                          <p className="text-xs text-slate-400">ID: {entry.amcu_customer_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        entry.shift === 'M' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${entry.shift === 'M' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                        {entry.shift === 'M' ? 'Morning' : 'Evening'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {entry.milk_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">{entry.quantity_litre}</span>
                      <span className="text-xs text-slate-400 ml-1">L</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(entry.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
