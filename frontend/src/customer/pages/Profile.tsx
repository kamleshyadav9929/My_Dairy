import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { getCacheIgnoreExpiry, setCache, CACHE_KEYS } from '../../lib/cache';
import { 
  Phone, MapPin, Hash, Milk, Calendar, ChevronRight, 
  Globe, Newspaper, Info, LogOut, Check, User
} from 'lucide-react';

export default function Profile() {
  const { t, language, changeLanguage } = useI18n();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.PROFILE));
  const [showLanguage, setShowLanguage] = useState(false);

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

  if (!profile) {
    return (
      <div className="space-y-4 pb-4">
        <h2 className="text-xl font-bold text-slate-800">{t('profile.title')}</h2>
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="skeleton w-16 h-16 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-5 w-32 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-4 flex items-center gap-4 border-b border-slate-50 last:border-0">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-3 w-16 mb-2" />
                <div className="skeleton h-4 w-24" />
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
      <h2 className="text-xl font-bold text-slate-800">{t('profile.title')}</h2>
      
      {/* Profile Card - Simple */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800">{profile.name}</h3>
            <p className="text-sm text-slate-500">ID: {profile.amcuId}</p>
          </div>
        </div>
      </div>

      {/* Details Card - Simple gray icons */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <h4 className="font-semibold text-slate-700 text-sm">{t('personal.details')}</h4>
        </div>
        <div className="divide-y divide-slate-50">
          <DetailRow icon={Hash} label={t('customer.id')} value={profile.amcuId} />
          <DetailRow icon={Phone} label={t('phone')} value={profile.phone || 'Not provided'} />
          <DetailRow icon={MapPin} label={t('address')} value={profile.address || 'Not provided'} />
          <DetailRow icon={Milk} label="Milk Type" value={profile.defaultMilkType || 'COW'} />
          <DetailRow 
            icon={Calendar} 
            label={t('member.since')} 
            value={memberDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} 
          />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <h4 className="font-semibold text-slate-700 text-sm">{t('settings.title')}</h4>
        </div>
        <div className="divide-y divide-slate-50">
          {/* Language */}
          <button
            onClick={() => setShowLanguage(!showLanguage)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">{t('app.language')}</p>
                <p className="text-xs text-slate-400">{language === 'en' ? 'English' : 'हिंदी'}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform ${showLanguage ? 'rotate-90' : ''}`} />
          </button>

          {showLanguage && (
            <div className="px-4 py-3 bg-slate-50/50 space-y-2">
              <button
                onClick={() => { changeLanguage('en'); setShowLanguage(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  language === 'en' ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-100'
                }`}
              >
                <span className="font-medium text-slate-700">English</span>
                {language === 'en' && <Check className="w-5 h-5 text-slate-600" />}
              </button>
              <button
                onClick={() => { changeLanguage('hi'); setShowLanguage(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  language === 'hi' ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-100'
                }`}
              >
                <span className="font-medium text-slate-700">हिंदी</span>
                {language === 'hi' && <Check className="w-5 h-5 text-slate-600" />}
              </button>
            </div>
          )}

          {/* News */}
          <button
            onClick={() => navigate('/customer/news')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-slate-500" />
              </div>
              <p className="font-medium text-slate-800">{t('news.title')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>

          {/* About */}
          <button
            onClick={() => navigate('/customer/about')}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-slate-500" />
              </div>
              <p className="font-medium text-slate-800">{t('about.title')}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-center gap-3 text-red-600 font-semibold hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        {t('logout')}
      </button>

      <p className="text-center text-xs text-slate-400 pt-2">
        {t('app.version')} 1.0.0
      </p>
    </div>
  );
}

// Simple DetailRow - all gray icons
function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="font-medium text-slate-800">{value}</p>
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
      <h2 className="text-xl font-bold text-slate-800">{t('news.title')}</h2>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-100">
              <div className="skeleton h-5 w-3/4 mb-3" />
              <div className="skeleton h-4 w-full mb-2" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
          <Newspaper className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">{t('no.data')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>
              <p className="text-xs text-slate-400 mt-3">
                {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
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
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800">{t('about.title')}</h2>
      
      {/* App Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <div className="flex items-center gap-4 mb-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-xl object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div>
            <h3 className="text-lg font-bold text-slate-800">My Dairy</h3>
            <p className="text-sm text-slate-500">Smart Milk Collection</p>
          </div>
        </div>
        
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Version</span>
            <span className="text-sm font-medium text-slate-800">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-slate-500">Platform</span>
            <span className="text-sm font-medium text-slate-800">Android</span>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-slate-400">
        © {new Date().getFullYear()} My Dairy
      </p>
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
        <h2 className="text-xl font-bold text-slate-800">{t('payments.title')}</h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-5 w-20 mb-2" />
                <div className="skeleton h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800">{t('payments.title')}</h2>
      
      {/* Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100">
        <p className="text-sm text-slate-500 mb-1">{t('total.received')}</p>
        <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalReceived)}</h3>
        <p className="text-xs text-slate-400 mt-1">{payments.length} payments</p>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">{t('no.payments')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {payments.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
                  {p.mode}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
