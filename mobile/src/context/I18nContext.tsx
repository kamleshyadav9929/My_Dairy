import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'hi';

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.passbook': 'Passbook',
    'nav.alerts': 'Alerts',
    'nav.profile': 'Profile',
    
    // Greetings
    'greeting.morning': 'Good Morning',
    'greeting.afternoon': 'Good Afternoon',
    'greeting.evening': 'Good Evening',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'today.collection': "Today's Collection",
    'total.earnings': 'Total Earnings',
    'total.milk': 'Total Milk',
    'pouring.days': 'Days',
    'collection.trends': 'Collection Trends',
    'last.7.days': 'Last 7 days',
    'recent.payments': 'Recent Payments',
    'quality': 'Quality',
    'avg.fat': 'AVG FAT',
    'avg.snf': 'AVG SNF',
    'balance': 'Balance',
    'this.month': 'This Month',
    'view.all': 'View All',
    'morning': 'Morning',
    'evening': 'Evening',
    'milk.fat': 'Fat',
    'milk.snf': 'SNF',
    'milk.collection': 'Milk Collection',
    'payment.received': 'Payment Received',
    'no.collection': 'No collection yet',
    'active': 'Active',
    'see.all': 'See All',
    'no.payments': 'No recent payments',
    
    // Passbook
    'passbook.title': 'Passbook',
    'current.balance': 'Current Balance',
    'earned': 'Earned',
    'received': 'Received',
    'all': 'All',
    'milk': 'Milk',
    'payments': 'Payments',
    'no.transactions': 'No transactions',
    
    // Alerts
    'alerts.title': 'Notifications',
    'all.caught.up': 'All caught up!',
    'no.notifications': 'No notifications right now',
    
    // Profile
    'profile.title': 'Profile',
    'settings': 'SETTINGS',
    'push.notifications': 'Push Notifications',
    'notifications.desc': 'Receive alerts for entries & payments',
    'language': 'Language',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    'logout': 'Logout',
    'logout.confirm': 'Are you sure you want to logout?',
    'cancel': 'Cancel',
    'select.language': 'Select Language',
    'select.theme': 'Select Theme',
    'version': 'My Dairy v1.0.0',
    
    // Login
    'welcome.back': 'Welcome Back',
    'login.subtitle': 'Login to your dairy account to view entries and payments',
    'customer.id': 'Customer ID / Phone',
    'enter.id': 'Enter your ID',
    'password': 'Password',
    'enter.password': 'Enter password',
    'login': 'Login',
    'no.account': "Don't have an account?",
    'contact.admin': 'Contact Administrator',
  },
  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.passbook': 'पासबुक',
    'nav.alerts': 'अलर्ट',
    'nav.profile': 'प्रोफाइल',
    
    // Greetings
    'greeting.morning': 'सुप्रभात',
    'greeting.afternoon': 'नमस्ते',
    'greeting.evening': 'शुभ संध्या',
    
    // Dashboard
    'dashboard.title': 'डैशबोर्ड',
    'today.collection': 'आज का संग्रह',
    'total.earnings': 'कुल कमाई',
    'total.milk': 'कुल दूध',
    'pouring.days': 'दिन',
    'collection.trends': 'संग्रह रुझान',
    'last.7.days': 'पिछले 7 दिन',
    'recent.payments': 'हाल के भुगतान',
    'quality': 'गुणवत्ता',
    'avg.fat': 'औसत फैट',
    'avg.snf': 'औसत SNF',
    'balance': 'बैलेंस',
    'this.month': 'इस महीने',
    'view.all': 'सभी देखें',
    'morning': 'सुबह',
    'evening': 'शाम',
    'milk.fat': 'फैट',
    'milk.snf': 'SNF',
    'milk.collection': 'दूध संग्रह',
    'payment.received': 'भुगतान प्राप्त',
    'no.collection': 'अभी तक कोई संग्रह नहीं',
    'active': 'सक्रिय',
    'see.all': 'सभी देखें',
    'no.payments': 'कोई हाल का भुगतान नहीं',
    
    // Passbook
    'passbook.title': 'पासबुक',
    'current.balance': 'वर्तमान बैलेंस',
    'earned': 'कमाई',
    'received': 'प्राप्त',
    'all': 'सभी',
    'milk': 'दूध',
    'payments': 'भुगतान',
    'no.transactions': 'कोई लेनदेन नहीं',
    
    // Alerts
    'alerts.title': 'सूचनाएं',
    'all.caught.up': 'सब पढ़ लिया!',
    'no.notifications': 'अभी कोई सूचना नहीं',
    
    // Profile
    'profile.title': 'प्रोफाइल',
    'settings': 'सेटिंग्स',
    'push.notifications': 'पुश नोटिफिकेशन',
    'notifications.desc': 'एंट्री और भुगतान के लिए अलर्ट',
    'language': 'भाषा',
    'theme': 'थीम',
    'light': 'लाइट',
    'dark': 'डार्क',
    'system': 'सिस्टम',
    'logout': 'लॉगआउट',
    'logout.confirm': 'क्या आप लॉगआउट करना चाहते हैं?',
    'cancel': 'रद्द करें',
    'select.language': 'भाषा चुनें',
    'select.theme': 'थीम चुनें',
    'version': 'माय डेयरी v1.0.0',
    
    // Login
    'welcome.back': 'स्वागत है',
    'login.subtitle': 'अपने डेयरी खाते में लॉगिन करें',
    'customer.id': 'ग्राहक आईडी / फ़ोन',
    'enter.id': 'अपना आईडी दर्ज करें',
    'password': 'पासवर्ड',
    'enter.password': 'पासवर्ड दर्ज करें',
    'login': 'लॉगिन',
    'no.account': 'खाता नहीं है?',
    'contact.admin': 'एडमिन से संपर्क करें',
  }
};

type TranslationKeys = keyof typeof translations['en'];

interface I18nContextType {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('app_language');
      if (savedLang === 'hi' || savedLang === 'en') {
        setLanguage(savedLang);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const changeLanguage = useCallback(async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
  }, []);

  const t = useCallback((key: TranslationKeys): string => {
    return translations[language][key] || key;
  }, [language]);

  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export type { Language, TranslationKeys };
