import { useState, useEffect } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { Phone, MapPin, Hash, Milk, Calendar, User } from 'lucide-react';

export default function Profile() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    customerPortalApi.getProfile().then(res => setProfile(res.data));
  }, []);

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium">{t('loading')}</p>
    </div>
  );

  const memberDate = new Date(profile.memberSince || profile.created_at);
  const memberYears = new Date().getFullYear() - memberDate.getFullYear();

  return (
    <div className="pb-20 space-y-5">
      <h2 className="text-2xl font-bold text-slate-800">{t('profile.title')}</h2>
      
      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Gradient Header */}
        <div className="relative h-28 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center text-indigo-600 text-4xl font-bold shadow-xl shadow-indigo-200/50 border-4 border-white">
              {profile.name?.[0]?.toUpperCase() || <User className="w-10 h-10" />}
            </div>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="pt-16 pb-6 px-6 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{profile.name}</h3>
          <p className="text-slate-500 font-medium text-sm mb-4">
            {t('member.since')} {memberDate.getFullYear()} {memberYears > 0 && `• ${memberYears} ${memberYears === 1 ? 'year' : 'years'}`}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-100">
              ✓ Active Member
            </span>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
              ID: #{profile.amcuId}
            </span>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{t('personal.details')}</h4>
        </div>
        <div className="divide-y divide-slate-50">
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200/50">
              <Hash className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t('customer.id')}</p>
              <p className="font-bold text-slate-800 text-lg">{profile.amcuId}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200/50">
             <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t('phone')}</p>
              <p className="font-medium text-slate-800">{profile.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
             <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200/50">
               <MapPin className="w-5 h-5" />
             </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t('address')}</p>
              <p className="font-medium text-slate-800">{profile.address || 'Not provided'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
             <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200/50">
               <Milk className="w-5 h-5" />
             </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Default Milk Type</p>
              <p className="font-medium text-slate-800">{profile.defaultMilkType || 'COW'}</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
             <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
               <Calendar className="w-5 h-5" />
             </div>
            <div className="flex-1">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{t('member.since')}</p>
              <p className="font-medium text-slate-800">
                {memberDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ------------------------------------------------------------------
// News Page
// ------------------------------------------------------------------
export function News() {
  const { t } = useI18n();
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    customerPortalApi.getNews().then(res => setNews(res.data?.news || [])).catch(() => {});
  }, []);

  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('news.title')}</h2>
      {news.length === 0 ? (
        <div className="text-center text-slate-400 mt-10">{t('no.data')}</div>
      ) : (
        <div className="space-y-4">
          {news.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>
              <p className="text-xs text-slate-400 mt-3">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// About Page
// ------------------------------------------------------------------
export function About() {
  const { t } = useI18n();
  
  const features = [
    { icon: '📱', title: 'Real-time Updates', desc: 'Get instant notifications for every milk entry' },
    { icon: '📊', title: 'Digital Passbook', desc: 'Track all your transactions in one place' },
    { icon: '💰', title: 'Payment Tracking', desc: 'View your complete payment history' },
    { icon: '📈', title: 'Analytics', desc: 'Monitor your daily and monthly performance' },
  ];

  return (
    <div className="pb-20 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">{t('about.title')}</h2>
      
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[60px] -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -ml-8 -mb-8" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">My Dairy</h3>
              <p className="text-blue-100 text-sm font-medium">Smart Milk Collection System</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm leading-relaxed">
            A modern solution for dairy farmers to track milk deliveries, payments, and stay connected with their dairy cooperative.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">{feature.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* App Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">App Information</h4>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Version</span>
            <span className="font-bold text-slate-800">1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm text-slate-500">Platform</span>
            <span className="font-bold text-slate-800">Web / Android</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-500">Built with</span>
            <span className="font-bold text-slate-800">❤️ for Farmers</span>
          </div>
        </div>
      </div>
      
      {/* Footer Note */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} My Dairy. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Payments Page
// ------------------------------------------------------------------
export function LatestPayments() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerPortalApi.getPayments({ limit: 30 })
      .then(res => setPayments(res.data?.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const getModeIcon = (mode: string) => {
    const icons: Record<string, string> = {
      'CASH': '💵',
      'UPI': '📱',
      'BANK': '🏦',
      'OTHER': '💳'
    };
    return icons[mode] || '💰';
  };

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      'CASH': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'UPI': 'bg-purple-50 text-purple-700 border-purple-100',
      'BANK': 'bg-blue-50 text-blue-700 border-blue-100',
      'OTHER': 'bg-slate-50 text-slate-700 border-slate-100'
    };
    return colors[mode] || 'bg-slate-50 text-slate-700 border-slate-100';
  };

  if (loading) {
    return (
      <div className="pb-20">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('payments.title')}</h2>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('payments.title')}</h2>
      
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-xl shadow-emerald-200/50 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm">
              💰
            </div>
            <p className="text-emerald-100 text-sm font-medium">{t('total.received')}</p>
          </div>
          <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(totalReceived)}</h3>
          <p className="text-emerald-200 text-xs mt-2">{payments.length} payments in history</p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{t('payments.history')}</h3>
        </div>
        
        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-sm font-medium">{t('no.payments')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payments.map((p) => (
              <div key={p.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-xl border border-emerald-100 flex-shrink-0">
                    {getModeIcon(p.mode)}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(p.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wide ${getModeColor(p.mode)}`}>
                          {p.mode}
                        </span>
                        {p.reference && (
                          <p className="text-[10px] text-slate-400 mt-1.5 truncate max-w-[100px]" title={p.reference}>
                            Ref: {p.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
