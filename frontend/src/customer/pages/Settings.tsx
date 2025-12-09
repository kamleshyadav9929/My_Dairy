import { useI18n } from '../context/I18nContext';
import { Globe, Check } from 'lucide-react';

export default function Settings() {
  const { t, language, changeLanguage } = useI18n();

  return (
    <div className="pb-20">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('settings.title')}</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-800">{t('app.language')}</span>
            <p className="text-xs text-slate-500">Select your preferred language</p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <button 
            onClick={() => changeLanguage('en')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              language === 'en' 
                ? 'bg-blue-50 border-blue-500 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">🇬🇧</span>
              <div className="text-left">
                <p className={`font-bold ${language === 'en' ? 'text-blue-700' : 'text-slate-700'}`}>English</p>
                <p className="text-xs text-slate-500">Default language</p>
              </div>
            </div>
            {language === 'en' && (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>

          <button 
            onClick={() => changeLanguage('hi')}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              language === 'hi' 
                ? 'bg-orange-50 border-orange-500 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">🇮🇳</span>
              <div className="text-left">
                <p className={`font-bold ${language === 'hi' ? 'text-orange-700' : 'text-slate-700'}`}>हिंदी</p>
                <p className="text-xs text-slate-500">Hindi</p>
              </div>
            </div>
            {language === 'hi' && (
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center space-y-1">
        <p className="text-xs text-slate-400">{t('app.version')}</p>
        <p className="text-sm font-medium text-slate-600">1.0.0</p>
      </div>
    </div>
  );
}
