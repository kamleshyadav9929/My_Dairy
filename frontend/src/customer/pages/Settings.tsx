import { useI18n } from '../context/I18nContext';
import { Globe, Check } from 'lucide-react';

export default function Settings() {
  const { t, language, changeLanguage } = useI18n();

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight"
        style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
        {t('settings.title')}
      </h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden"
        style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '50ms' }}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/15">
            <Globe className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <span className="text-[13px] font-bold text-slate-800">{t('app.language')}</span>
            <p className="text-[11px] text-slate-400">Select your preferred language</p>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <button 
            onClick={() => changeLanguage('en')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
              language === 'en' 
                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
            }`}
            style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '100ms' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇬🇧</span>
              <div className="text-left">
                <p className={`text-[13px] font-bold ${language === 'en' ? 'text-indigo-700' : 'text-slate-700'}`}>English</p>
                <p className="text-[11px] text-slate-400">Default language</p>
              </div>
            </div>
            {language === 'en' && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>

          <button 
            onClick={() => changeLanguage('hi')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
              language === 'hi' 
                ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-500/20' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
            }`}
            style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '150ms' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🇮🇳</span>
              <div className="text-left">
                <p className={`text-[13px] font-bold ${language === 'hi' ? 'text-amber-700' : 'text-slate-700'}`}>हिंदी</p>
                <p className="text-[11px] text-slate-400">Hindi</p>
              </div>
            </div>
            {language === 'hi' && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-300 font-medium">{t('app.version')}</p>
        <p className="text-[13px] font-bold text-slate-500 mt-0.5">1.0.0</p>
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
