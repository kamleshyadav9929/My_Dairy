import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeSelector } from '../components/ThemeSelector';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, language } = useI18n();
  const { colors, isDark, themeMode } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications_enabled');
      if (savedNotifications !== null) setNotificationsEnabled(savedNotifications === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
  };

  const getThemeLabel = () => {
    if (themeMode === 'system') return `${t('system')} (${isDark ? t('dark') : t('light')})`;
    return themeMode === 'dark' ? t('dark') : t('light');
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'), 
      t('logout.confirm'), 
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>{t('profile.title')}</Text>
        </View>

        {/* Profile Card */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>{user?.name || 'Customer'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>ID: {user?.amcuId || user?.id || '-'}</Text>
            </View>
          </View>
          
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
              <Text style={{ marginLeft: 8, color: colors.textSecondary, fontSize: 14 }}>{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ paddingHorizontal: 20, color: colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 8 }}>
            {t('settings')}
          </Text>
          
          <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            {/* Notifications Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{t('push.notifications')}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{t('notifications.desc')}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} />

            {/* Language Selector */}
            <TouchableOpacity 
              onPress={() => setShowLanguageSelector(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Ionicons name="language-outline" size={20} color={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{t('language')}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                  {language === 'hi' ? 'हिंदी' : 'English'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 48 }} />

            {/* Theme Selector */}
            <TouchableOpacity 
              onPress={() => setShowThemeSelector(true)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontSize: 14 }}>{t('theme')}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{getThemeLabel()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
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
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{t('version')}</Text>
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modals */}
      <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />
      <ThemeSelector visible={showThemeSelector} onClose={() => setShowThemeSelector(false)} />
    </SafeAreaView>
  );
}
