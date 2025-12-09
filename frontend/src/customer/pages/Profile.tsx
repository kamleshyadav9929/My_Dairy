import { useState, useEffect } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { Phone, MapPin, Hash } from 'lucide-react';

export default function Profile() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    customerPortalApi.getProfile().then(res => setProfile(res.data));
  }, []);

  if (!profile) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('profile.title')}</h2>
      
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-500 to-indigo-600 -z-0" />
        <div className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600 text-4xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
          {profile.name[0]}
        </div>
        <h3 className="text-2xl font-bold text-slate-800">{profile.name}</h3>
        <p className="text-slate-500 font-medium text-sm">{t('member.since')} {new Date(profile.created_at).getFullYear()}</p>
        <div className="mt-4 flex justify-center gap-2"> 
           <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
             Active Member
           </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* ID Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm uppercase tracking-wide">
            {t('personal.details')}
          </div>
          <div className="divide-y divide-slate-50">
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{t('customer.id')}</p>
                <p className="font-bold text-slate-800 text-lg">{profile.amcu_customer_id}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                 <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{t('phone')}</p>
                <p className="font-medium text-slate-800">{profile.phone || '-'}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                 <MapPin className="w-5 h-5" />
               </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{t('address')}</p>
                <p className="font-medium text-slate-800">{profile.address || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details (Simulated) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 text-sm uppercase tracking-wide">
            {t('bank.info')}
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{t('bank.name')}</p>
                <p className="font-medium text-slate-800">State Bank of India</p>
             </div>
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{t('account.no')}</p>
                <p className="font-medium text-slate-800">XXXX-XXXX-1234</p>
             </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{t('ifsc')}</p>
                <p className="font-medium text-slate-800">SBIN0001234</p>
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
  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('about.title')}</h2>
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-blue-600">My Dairy Cooperative</h3>
        <p className="text-sm text-slate-600">
          We are dedicated to empowering farmers through technology and fair practices.
        </p>
        <div className="pt-4 border-t border-slate-100">
          <p className="font-bold text-sm text-slate-800 mb-1">Contact Us</p>
          <p className="text-sm text-slate-600">123 Dairy Road, Village Center</p>
          <p className="text-sm text-slate-600">Phone: +91 98765 43210</p>
        </div>
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
