import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { getCacheIgnoreExpiry, setCache, CACHE_KEYS } from '../../lib/cache';
import { 
  Phone, MapPin, Hash, Milk, Calendar, ChevronRight, 
  Globe, Newspaper, Info, LogOut, Check, User, Bell, Palette, Sun, Moon, Monitor, CreditCard
} from 'lucide-react';

// ─── Gradient icon configs ────────────────────────────────
const DETAIL_ICONS: Record<string, { gradient: string }> = {
  hash:     { gradient: 'from-slate-400 to-slate-500' },
  phone:    { gradient: 'from-blue-400 to-cyan-500' },
  address:  { gradient: 'from-rose-400 to-pink-500' },
  milk:     { gradient: 'from-amber-400 to-orange-500' },
  calendar: { gradient: 'from-violet-400 to-purple-500' },
};

const SETTING_ICONS: Record<string, { gradient: string }> = {
  bell:       { gradient: 'from-red-400 to-rose-500' },
  language:   { gradient: 'from-blue-400 to-indigo-500' },
  theme:      { gradient: 'from-amber-400 to-orange-500' },
  news:       { gradient: 'from-emerald-400 to-teal-500' },
  about:      { gradient: 'from-slate-400 to-slate-500' },
};

export default function Profile() {
  const { t, language, changeLanguage } = useI18n();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.PROFILE));
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications_enabled') !== 'false';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'system';
  });

  useEffect(() => {
    customerPortalApi.getProfile().then(res => {
      setProfile(res.data);
      setCache(CACHE_KEYS.PROFILE, res.data, 60 * 60 * 1000);
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleNotifications = () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    localStorage.setItem('notifications_enabled', String(newVal));
  };

  const handleThemeChange = (mode: string) => {
    setTheme(mode);
    localStorage.setItem('app_theme', mode);
    setShowTheme(false);
  };

  // ─── Skeleton ──────────────────────────────────
  if (!profile) {
    return (
      <div className="space-y-4 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('profile.title')}</h2>
        <div className="bg-white rounded-2xl p-6 border border-slate-100/80 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-5 w-32 mb-2 rounded-md bg-slate-100 animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="p-4 flex items-center gap-3 border-b border-slate-50 last:border-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="flex-1">
                <div className="h-3 w-14 mb-2 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const memberDate = new Date(profile.memberSince || profile.created_at);

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight"
        style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
        {t('profile.title')}
      </h2>
      
      {/* ─── Profile Card ─────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '50ms' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">{profile.name}</h3>
            <p className="text-sm text-slate-500">ID: {profile.amcuId}</p>
            {profile.phone && (
              <p className="text-xs text-slate-400 mt-0.5">{profile.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Details Card ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '100ms' }}>
        <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100">
          <h4 className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">{t('personal.details')}</h4>
        </div>
        <div className="divide-y divide-slate-50/80">
          <GradientDetailRow icon={Hash} gradient={DETAIL_ICONS.hash.gradient} label={t('customer.id')} value={profile.amcuId} />
          <GradientDetailRow icon={Phone} gradient={DETAIL_ICONS.phone.gradient} label={t('phone')} value={profile.phone || 'Not provided'} />
          <GradientDetailRow icon={MapPin} gradient={DETAIL_ICONS.address.gradient} label={t('address')} value={profile.address || 'Not provided'} />
          <GradientDetailRow icon={Milk} gradient={DETAIL_ICONS.milk.gradient} label="Milk Type" value={profile.defaultMilkType || 'COW'} />
          <GradientDetailRow 
            icon={Calendar} 
            gradient={DETAIL_ICONS.calendar.gradient}
            label={t('member.since')} 
            value={memberDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 
          />
        </div>
      </div>

      {/* ─── Settings ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '150ms' }}>
        <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100">
          <h4 className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">{t('settings')}</h4>
        </div>
        <div className="divide-y divide-slate-50/80">
          {/* Push Notifications Toggle */}
          <div className="p-4 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${SETTING_ICONS.bell.gradient} flex items-center justify-center shadow-lg shadow-red-500/15 group-hover:scale-105 transition-transform duration-300`}>
                <Bell className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800">{t('push.notifications')}</p>
                <p className="text-[11px] text-slate-400">{t('notifications.desc')}</p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                notificationsEnabled 
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30' 
                  : 'bg-slate-200'
              }`}
            >
              <div className={`absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md transition-transform duration-300 ${
                notificationsEnabled ? 'translate-x-[23px]' : 'translate-x-[3px]'
              }`} />
            </button>
          </div>

          {/* Language */}
          <button
            onClick={() => setShowLanguage(!showLanguage)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${SETTING_ICONS.language.gradient} flex items-center justify-center shadow-lg shadow-blue-500/15 group-hover:scale-105 transition-transform duration-300`}>
                <Globe className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-slate-800">{t('language')}</p>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'English' : 'हिंदी'}</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showLanguage ? 'rotate-90' : ''}`} />
          </button>

          {showLanguage && (
            <div className="px-4 py-3 bg-slate-50/40 space-y-2"
              style={{ animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
              {[
                { key: 'en', label: 'English', flag: '🇬🇧' },
                { key: 'hi', label: 'हिंदी', flag: '🇮🇳' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { changeLanguage(opt.key as any); setShowLanguage(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-98 ${
                    language === opt.key 
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{opt.flag}</span>
                    <span className={`font-semibold ${language === opt.key ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</span>
                  </div>
                  {language === opt.key && <Check className="w-4 h-4 text-indigo-500" />}
                </button>
              ))}
            </div>
          )}

          {/* Theme */}
          <button
            onClick={() => setShowTheme(!showTheme)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${SETTING_ICONS.theme.gradient} flex items-center justify-center shadow-lg shadow-amber-500/15 group-hover:scale-105 transition-transform duration-300`}>
                <Palette className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-slate-800">{t('theme')}</p>
                <p className="text-[11px] text-slate-400">
                  {theme === 'light' ? t('light') : theme === 'dark' ? t('dark') : t('system')}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${showTheme ? 'rotate-90' : ''}`} />
          </button>

          {showTheme && (
            <div className="px-4 py-3 bg-slate-50/40 space-y-2"
              style={{ animation: 'fadeSlideUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
              {[
                { key: 'light', label: t('light'), icon: Sun },
                { key: 'dark', label: t('dark'), icon: Moon },
                { key: 'system', label: t('system'), icon: Monitor },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleThemeChange(opt.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-98 ${
                    theme === opt.key 
                      ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-500/20' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <opt.icon className={`w-4 h-4 ${theme === opt.key ? 'text-amber-600' : 'text-slate-500'}`} />
                    <span className={`font-semibold ${theme === opt.key ? 'text-amber-700' : 'text-slate-700'}`}>{opt.label}</span>
                  </div>
                  {theme === opt.key && <Check className="w-4 h-4 text-amber-500" />}
                </button>
              ))}
            </div>
          )}

          {/* News */}
          <button
            onClick={() => navigate('/customer/news')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${SETTING_ICONS.news.gradient} flex items-center justify-center shadow-lg shadow-emerald-500/15 group-hover:scale-105 transition-transform duration-300`}>
                <Newspaper className="w-[18px] h-[18px] text-white" />
              </div>
              <p className="text-[13px] font-bold text-slate-800">{t('news.title')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          {/* About */}
          <button
            onClick={() => navigate('/customer/about')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${SETTING_ICONS.about.gradient} flex items-center justify-center shadow-lg shadow-slate-500/15 group-hover:scale-105 transition-transform duration-300`}>
                <Info className="w-[18px] h-[18px] text-white" />
              </div>
              <p className="text-[13px] font-bold text-slate-800">{t('about.title')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* ─── Logout ───────────────────────────── */}
      <button
        onClick={handleLogout}
        className="w-full bg-white rounded-2xl p-4 border border-red-100 flex items-center justify-center gap-2.5 shadow-sm hover:bg-red-50 hover:border-red-200 active:scale-[0.98] transition-all duration-200 group"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '200ms' }}
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform duration-300">
          <LogOut className="w-4 h-4 text-white" />
        </div>
        <span className="text-[14px] font-bold text-red-600">{t('logout')}</span>
      </button>

      <p className="text-center text-[11px] text-slate-300 font-medium pt-1">
        {t('version')}
      </p>

      {/* Keyframe */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Gradient Detail Row ─────────────────────────────────
function GradientDetailRow({ icon: Icon, gradient, label, value }: {
  icon: any; gradient: string; label: string; value: string;
}) {
  return (
    <div className="p-4 flex items-center gap-3 group">
      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-slate-500/10 group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-[18px] h-[18px] text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-[13px] font-bold text-slate-800 mt-0.5 truncate">{value}</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerPortalApi.getNews()
      .then(res => setNews(res.data?.news || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('news.title')}</h2>
      
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-sm">
              <div className="h-5 w-3/4 mb-3 rounded-md bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-4 w-full mb-2 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100/80 shadow-sm flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
            <Newspaper className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-400">{t('no.data')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item, idx) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100/80 shadow-sm"
              style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${idx * 60}ms` }}>
              <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>
              <p className="text-[11px] text-slate-300 font-medium mt-3">
                {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// About Page
// ------------------------------------------------------------------
export function About() {
  const { t } = useI18n();

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('about.title')}</h2>
      
      {/* App Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Milk className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">My Dairy</h3>
            <p className="text-[12px] text-slate-400 font-medium">Smart Milk Collection</p>
          </div>
        </div>
        
        <div className="space-y-2 pt-3 border-t border-slate-100/80">
          <div className="flex justify-between">
            <span className="text-[12px] text-slate-400 font-medium">Version</span>
            <span className="text-[12px] font-bold text-slate-700">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12px] text-slate-400 font-medium">Platform</span>
            <span className="text-[12px] font-bold text-slate-700">Web</span>
          </div>
        </div>
      </div>
      
      <p className="text-center text-[11px] text-slate-300 font-medium">
        © {new Date().getFullYear()} My Dairy
      </p>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// LatestPayments Page
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

  if (loading) {
    return (
      <div className="space-y-4 pb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('payments.title')}</h2>
        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm p-4 space-y-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="flex-1">
                <div className="h-5 w-20 mb-2 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('payments.title')}</h2>
      
      {/* Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-sm"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CreditCard className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{t('total.received')}</span>
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(totalReceived)}</h3>
        <p className="text-[11px] text-slate-300 font-medium mt-1">{payments.length} payments</p>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-2xl border border-slate-100/80 shadow-sm overflow-hidden"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '80ms' }}>
        {payments.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-slate-300">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <CreditCard className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-slate-400">{t('no.payments')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50/80">
            {payments.map((p, idx) => (
              <div key={p.id} className="p-4 flex items-center justify-between group"
                style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: `${100 + idx * 40}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/15 group-hover:scale-105 transition-transform duration-300">
                    <CreditCard className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-emerald-600">{formatCurrency(p.amount)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 uppercase tracking-wider">
                  {p.mode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
