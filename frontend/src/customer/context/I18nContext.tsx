import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Language = 'en' | 'hi';

const translations = {
  en: {
    // Navigation & Pages
    'dashboard.title': 'Dashboard',
    'passbook.title': 'Passbook',
    'payments.title': 'Payments',
    'reports.title': 'Reports',
    'notifications.title': 'Notifications',
    'news.title': 'News',
    'settings.title': 'Settings',
    'profile.title': 'My Profile',
    'about.title': 'About Us',
    'logout': 'Logout',
    
    // Bottom Navigation
    'nav.home': 'Home',
    'nav.passbook': 'Passbook',
    'nav.payments': 'Payments',
    'nav.alerts': 'Alerts',
    'nav.profile': 'Profile',
    
    // Greetings
    'greeting.morning': 'Good Morning',
    'greeting.afternoon': 'Good Afternoon',
    'greeting.evening': 'Good Evening',
    
    // Dashboard
    'today.collection': "Today's Collection",
    'milk.summary': 'Collection Summary',
    'total.earnings': 'Total Earnings',
    'total.milk': 'Total Milk',
    'pouring.days': 'Days',
    'collection.trends': 'Collection Trends',
    'milk.quantity.time': 'Milk quantity over time',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'recent.payments': 'Recent Payments',
    'this.month': 'This Month',
    'last.7.days': 'Last 7 days',
    'quality': 'Quality',
    'avg.fat': 'AVG FAT',
    'avg.snf': 'AVG SNF',
    'no.collection': 'No collection yet',
    'active': 'Active',
    'see.all': 'See All',
    'milk.collection': 'Milk Collection',
    
    // Quick Actions
    'passbook': 'Passbook',
    'download': 'Download',
    'share': 'Share',
    'contact': 'Contact',
    
    // Milk Details
    'morning': 'Morning',
    'evening': 'Evening',
    'view.all': 'View All',
    'milk.qty': 'Quantity',
    'milk.fat': 'Fat',
    'milk.snf': 'SNF',
    'milk.rate': 'Rate',
    'milk.amount': 'Amount',
    'litres': 'Litres',
    'milk.supply': 'Milk Supply',
    'payment.received': 'Payment Received',
    
    // Passbook
    'closing.balance': 'Closing Balance',
    'current.balance': 'Current Balance',
    'earned': 'Earned',
    'received': 'Received',
    'credit.status': 'Credit Status',
    'debit.status': 'Debit Status',
    'recent.transactions': 'Recent Transactions',
    'no.transactions': 'No transactions',
    'all': 'All',
    'milk': 'Milk',
    'payment': 'Payment',
    'balance': 'Balance',
    'update.statement': 'Update Statement',
    'reset.password': 'Reset Password',
    'request.submitted': 'Request Submitted!',
    'contact.admin': 'Contact the dairy admin for your new password.',
    'back.to.login': 'Back to Login',
    'submit.request': 'Submit Request',
    
    // Payments
    'total.received': 'Total Received',
    'payments.history': 'Payment History',
    'no.payments': 'No payments recorded yet',
    
    // Dates
    'date.from': 'From Date',
    'date.to': 'To Date',
    
    // Actions
    'submit': 'Submit',
    'download.pdf': 'Download PDF',
    
    // Status
    'no.data': 'No data found',
    'loading': 'Loading...',
    'last.synced': 'Last synced',
    
    // Settings
    'settings': 'SETTINGS',
    'app.language': 'App Language',
    'app.version': 'App Version',
    'push.notifications': 'Push Notifications',
    'notifications.desc': 'Receive alerts for entries & payments',
    'language': 'Language',
    'theme': 'Theme',
    'light': 'Light',
    'dark': 'Dark',
    'system': 'System',
    'select.language': 'Select Language',
    'select.theme': 'Select Theme',
    'version': 'My Dairy v1.0.0',
    'logout.confirm': 'Are you sure you want to logout?',
    'cancel': 'Cancel',
    
    // Profile
    'personal.details': 'Personal Details',
    'customer.id': 'Customer ID',
    'phone': 'Phone',
    'address': 'Address',
    'bank.info': 'Bank Information',
    'bank.name': 'Bank Name',
    'account.no': 'Account No',
    'ifsc': 'IFSC Code',
    'member.since': 'Member since',
    'active.member': 'Active Member',
    
    // Alerts / Notifications
    'alerts.title': 'Notifications',
    'all.caught.up': 'All caught up!',
    'mark.all.read': 'Mark All Read',
    'no.notifications': 'No notifications yet',
    
    // Login
    'welcome.back': 'Welcome Back',
    'login.subtitle': 'Login to your dairy account to view entries and payments',
    'enter.id': 'Enter your ID',
    'password': 'Password',
    'enter.password': 'Enter password',
    'login': 'Login',
    'no.account': "Don't have an account?",
  },
  hi: {
    // Navigation & Pages
    'dashboard.title': 'डैशबोर्ड',
    'passbook.title': 'पासबुक',
    'payments.title': 'भुगतान',
    'reports.title': 'रिपोर्ट',
    'notifications.title': 'सूचनाएं',
    'news.title': 'समाचार',
    'settings.title': 'सेटिंग्स',
    'profile.title': 'मेरा प्रोफाइल',
    'about.title': 'हमारे बारे में',
    'logout': 'लॉगआउट',
    
    // Bottom Navigation
    'nav.home': 'होम',
    'nav.passbook': 'पासबुक',
    'nav.payments': 'भुगतान',
    'nav.alerts': 'अलर्ट',
    'nav.profile': 'प्रोफाइल',
    
    // Greetings
    'greeting.morning': 'सुप्रभात',
    'greeting.afternoon': 'नमस्ते',
    'greeting.evening': 'शुभ संध्या',
    
    // Dashboard
    'today.collection': 'आज का संग्रह',
    'milk.summary': 'संग्रह सारांश',
    'total.earnings': 'कुल कमाई',
    'total.milk': 'कुल दूध',
    'pouring.days': 'दिन',
    'collection.trends': 'संग्रह रुझान',
    'milk.quantity.time': 'समय के साथ दूध की मात्रा',
    'weekly': 'साप्ताहिक',
    'monthly': 'मासिक',
    'recent.payments': 'हाल के भुगतान',
    'this.month': 'इस महीने',
    'last.7.days': 'पिछले 7 दिन',
    'quality': 'गुणवत्ता',
    'avg.fat': 'औसत फैट',
    'avg.snf': 'औसत SNF',
    'no.collection': 'अभी तक कोई संग्रह नहीं',
    'active': 'सक्रिय',
    'see.all': 'सभी देखें',
    'milk.collection': 'दूध संग्रह',
    
    // Quick Actions
    'passbook': 'पासबुक',
    'download': 'डाउनलोड',
    'share': 'शेयर',
    'contact': 'संपर्क',
    
    // Milk Details
    'morning': 'सुबह',
    'evening': 'शाम',
    'view.all': 'सभी देखें',
    'milk.qty': 'मात्रा',
    'milk.fat': 'फैट',
    'milk.snf': 'एसएनएफ',
    'milk.rate': 'दर',
    'milk.amount': 'राशि',
    'litres': 'लीटर',
    'milk.supply': 'दूध आपूर्ति',
    'payment.received': 'भुगतान प्राप्त',
    
    // Passbook
    'closing.balance': 'क्लोज़िंग बैलेंस',
    'current.balance': 'वर्तमान बैलेंस',
    'earned': 'कमाई',
    'received': 'प्राप्त',
    'credit.status': 'क्रेडिट स्थिति',
    'debit.status': 'डेबिट स्थिति',
    'recent.transactions': 'हाल के लेनदेन',
    'no.transactions': 'कोई लेनदेन नहीं',
    'all': 'सभी',
    'milk': 'दूध',
    'payment': 'भुगतान',
    'balance': 'बैलेंस',
    'update.statement': 'स्टेटमेंट अपडेट करें',
    'reset.password': 'पासवर्ड रीसेट करें',
    'request.submitted': 'अनुरोध सबमिट!',
    'contact.admin': 'अपने नए पासवर्ड के लिए डेयरी एडमिन से संपर्क करें।',
    'back.to.login': 'लॉगिन पर वापस',
    'submit.request': 'अनुरोध सबमिट करें',
    
    // Payments
    'total.received': 'कुल प्राप्त',
    'payments.history': 'भुगतान इतिहास',
    'no.payments': 'अभी तक कोई भुगतान दर्ज नहीं',
    
    // Dates
    'date.from': 'से तारीख',
    'date.to': 'तक तारीख',
    
    // Actions
    'submit': 'जमा करें',
    'download.pdf': 'PDF डाउनलोड',
    
    // Status
    'no.data': 'कोई डेटा नहीं मिला',
    'loading': 'लोड हो रहा है...',
    'last.synced': 'अंतिम सिंक',
    
    // Settings
    'settings': 'सेटिंग्स',
    'app.language': 'ऐप भाषा',
    'app.version': 'ऐप संस्करण',
    'push.notifications': 'पुश नोटिफिकेशन',
    'notifications.desc': 'एंट्री और भुगतान के लिए अलर्ट',
    'language': 'भाषा',
    'theme': 'थीम',
    'light': 'लाइट',
    'dark': 'डार्क',
    'system': 'सिस्टम',
    'select.language': 'भाषा चुनें',
    'select.theme': 'थीम चुनें',
    'version': 'माय डेयरी v1.0.0',
    'logout.confirm': 'क्या आप लॉगआउट करना चाहते हैं?',
    'cancel': 'रद्द करें',
    
    // Profile
    'personal.details': 'व्यक्तिगत विवरण',
    'customer.id': 'ग्राहक आईडी',
    'phone': 'फ़ोन',
    'address': 'पता',
    'bank.info': 'बैंक जानकारी',
    'bank.name': 'बैंक का नाम',
    'account.no': 'खाता नंबर',
    'ifsc': 'IFSC कोड',
    'member.since': 'सदस्य वर्ष',
    'active.member': 'सक्रिय सदस्य',
    
    // Alerts / Notifications
    'alerts.title': 'सूचनाएं',
    'all.caught.up': 'सब पढ़ लिया!',
    'mark.all.read': 'सभी पढ़ा हुआ करें',
    'no.notifications': 'अभी कोई सूचना नहीं',
    
    // Login
    'welcome.back': 'स्वागत है',
    'login.subtitle': 'अपने डेयरी खाते में लॉगिन करें',
    'enter.id': 'अपना आईडी दर्ज करें',
    'password': 'पासवर्ड',
    'enter.password': 'पासवर्ड दर्ज करें',
    'login': 'लॉगिन',
    'no.account': 'खाता नहीं है?',
  }
};

type TranslationKey = keyof typeof translations['en'];

interface I18nContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('customer_lang') as Language) || 'en';
  });

  const changeLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('customer_lang', lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

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
