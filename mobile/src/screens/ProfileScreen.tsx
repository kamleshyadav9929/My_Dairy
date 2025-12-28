import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert, Switch, useColorScheme } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const systemColorScheme = useColorScheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications_enabled');
      const savedLanguage = await AsyncStorage.getItem('language');
      const savedTheme = await AsyncStorage.getItem('theme');
      
      if (savedNotifications !== null) setNotificationsEnabled(savedNotifications === 'true');
      if (savedLanguage === 'hi' || savedLanguage === 'en') setLanguage(savedLanguage);
      if (savedTheme) setTheme(savedTheme as any);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'भाषा चुनें / Select Language',
      '',
      [
        { 
          text: 'English', 
          onPress: () => saveLanguage('en'),
          style: language === 'en' ? 'default' : 'default'
        },
        { 
          text: 'हिंदी (Hindi)', 
          onPress: () => saveLanguage('hi'),
          style: language === 'hi' ? 'default' : 'default'
        },
        { text: 'Cancel / रद्द करें', style: 'cancel' },
      ]
    );
  };

  const saveLanguage = async (lang: 'en' | 'hi') => {
    setLanguage(lang);
    await AsyncStorage.setItem('language', lang);
    Alert.alert(
      lang === 'hi' ? 'भाषा बदली गई' : 'Language Changed', 
      lang === 'hi' ? 'कृपया ऐप रीस्टार्ट करें' : 'Please restart the app for full effect.'
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      language === 'hi' ? 'थीम चुनें' : 'Select Theme',
      '',
      [
        { text: language === 'hi' ? 'लाइट' : 'Light', onPress: () => saveTheme('light') },
        { text: language === 'hi' ? 'डार्क' : 'Dark', onPress: () => saveTheme('dark') },
        { text: language === 'hi' ? 'सिस्टम' : 'System Default', onPress: () => saveTheme('system') },
        { text: language === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  const saveTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const getThemeLabel = () => {
    const labels = {
      en: { light: 'Light', dark: 'Dark', system: `System (${systemColorScheme === 'dark' ? 'Dark' : 'Light'})` },
      hi: { light: 'लाइट', dark: 'डार्क', system: `सिस्टम (${systemColorScheme === 'dark' ? 'डार्क' : 'लाइट'})` }
    };
    return labels[language][theme];
  };

  const handleLogout = () => {
    Alert.alert(
      language === 'hi' ? 'लॉगआउट' : 'Logout', 
      language === 'hi' ? 'क्या आप वाकई लॉगआउट करना चाहते हैं?' : 'Are you sure you want to logout?', 
      [
        { text: language === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        { text: language === 'hi' ? 'लॉगआउट' : 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const t = (key: string) => {
    const translations: any = {
      en: {
        'profile': 'Profile',
        'settings': 'SETTINGS',
        'push.notifications': 'Push Notifications',
        'notifications.desc': 'Receive alerts for entries & payments',
        'language': 'Language',
        'theme': 'Theme',
        'logout': 'Logout',
        'version': 'My Dairy v1.0.0',
      },
      hi: {
        'profile': 'प्रोफाइल',
        'settings': 'सेटिंग्स',
        'push.notifications': 'पुश नोटिफिकेशन',
        'notifications.desc': 'एंट्री और भुगतान के लिए अलर्ट प्राप्त करें',
        'language': 'भाषा',
        'theme': 'थीम',
        'logout': 'लॉगआउट',
        'version': 'माय डेयरी v1.0.0',
      }
    };
    return translations[language][key] || key;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }}>
          <Text style={{ color: '#171717', fontSize: 20, fontWeight: '600' }}>{t('profile')}</Text>
        </View>

        {/* Profile Card */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: '#fafafa', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f5f5f5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: '#171717', fontSize: 18, fontWeight: '600' }}>{user?.name || 'Customer'}</Text>
              <Text style={{ color: '#737373', fontSize: 12, marginTop: 4 }}>ID: {user?.amcuId || user?.id || '-'}</Text>
            </View>
          </View>
          
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e5e5' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="call-outline" size={16} color="#737373" />
              <Text style={{ marginLeft: 8, color: '#525252', fontSize: 14 }}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ paddingHorizontal: 20, color: '#a3a3a3', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
            {t('settings')}
          </Text>
          
          <View style={{ marginHorizontal: 20, backgroundColor: '#fafafa', borderRadius: 12, borderWidth: 1, borderColor: '#f5f5f5', overflow: 'hidden' }}>
            {/* Notifications Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <Ionicons name="notifications-outline" size={20} color="#525252" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#171717', fontSize: 14 }}>{t('push.notifications')}</Text>
                <Text style={{ color: '#a3a3a3', fontSize: 11, marginTop: 2 }}>{t('notifications.desc')}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#e5e5e5', true: '#4f46e5' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={{ height: 1, backgroundColor: '#f5f5f5', marginLeft: 48 }} />

            {/* Language Selector */}
            <TouchableOpacity 
              onPress={handleLanguageChange}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Ionicons name="language-outline" size={20} color="#525252" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#171717', fontSize: 14 }}>{t('language')}</Text>
                <Text style={{ color: '#a3a3a3', fontSize: 11, marginTop: 2 }}>
                  {language === 'hi' ? 'हिंदी' : 'English'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d4d4d4" />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: '#f5f5f5', marginLeft: 48 }} />

            {/* Theme Selector */}
            <TouchableOpacity 
              onPress={handleThemeChange}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Ionicons name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'} size={20} color="#525252" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#171717', fontSize: 14 }}>{t('theme')}</Text>
                <Text style={{ color: '#a3a3a3', fontSize: 11, marginTop: 2 }}>{getThemeLabel()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d4d4d4" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={{ marginHorizontal: 20, marginTop: 32, marginBottom: 32 }}>
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 14, 
              borderRadius: 12, 
              backgroundColor: '#fef2f2', 
              borderWidth: 1, 
              borderColor: '#fecaca' 
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text style={{ marginLeft: 8, color: '#dc2626', fontWeight: '600' }}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={{ alignItems: 'center', paddingBottom: 24 }}>
          <Text style={{ color: '#d4d4d4', fontSize: 12 }}>{t('version')}</Text>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
