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
    
    // Dashboard
    'today.collection': "Today's Collection",
    'milk.summary': 'Collection Summary',
    'total.earnings': 'Total Earnings (Month)',
    'total.milk': 'Total Milk',
    'pouring.days': 'Days',
    'collection.trends': 'Collection Trends',
    'milk.quantity.time': 'Milk quantity over time',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'recent.payments': 'Recent Payments',
    
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
    'credit.status': 'Credit Status',
    'debit.status': 'Debit Status',
    'recent.transactions': 'Recent Transactions',
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
    'download': 'Download',
    'download.pdf': 'Download PDF',
    
    // Status
    'no.data': 'No data found',
    'loading': 'Loading...',
    'last.synced': 'Last synced',
    
    // Settings
    'app.language': 'App Language',
    'app.version': 'App Version',
    
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
    
    // Notifications
    'mark.all.read': 'Mark All Read',
    'no.notifications': 'No notifications yet',
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
    'logout': 'लॉग आउट',
    
    // Dashboard
    'today.collection': 'आज का संग्रह',
    'milk.summary': 'संग्रह सारांश',
    'total.earnings': 'कुल कमाई (महीना)',
    'total.milk': 'कुल दूध',
    'pouring.days': 'दिन',
    'collection.trends': 'संग्रह रुझान',
    'milk.quantity.time': 'समय के साथ दूध की मात्रा',
    'weekly': 'साप्ताहिक',
    'monthly': 'मासिक',
    'recent.payments': 'हाल के भुगतान',
    
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
    'credit.status': 'क्रेडिट स्थिति',
    'debit.status': 'डेबिट स्थिति',
    'recent.transactions': 'हाल के लेनदेन',
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
    'download': 'डाउनलोड',
    'download.pdf': 'PDF डाउनलोड',
    
    // Status
    'no.data': 'कोई डेटा नहीं मिला',
    'loading': 'लोड हो रहा है...',
    'last.synced': 'अंतिम सिंक',
    
    // Settings
    'app.language': 'ऐप भाषा',
    'app.version': 'ऐप संस्करण',
    
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
    
    // Notifications
    'mark.all.read': 'सभी पढ़ा हुआ करें',
    'no.notifications': 'अभी कोई सूचना नहीं',
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
