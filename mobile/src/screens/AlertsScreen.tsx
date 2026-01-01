import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { customerPortalApi } from '../lib/api';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { AlertsSkeleton } from '../components/Skeleton';
import { useNetwork } from '../context/NetworkContext';
import { cacheService } from '../lib/cacheService';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  amount?: number;
}

export default function AlertsScreen() {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const { isConnected } = useNetwork();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadData = async () => {
    try {
      if (isConnected) {
        const res = await customerPortalApi.getNotifications();
        const data = res.data.notifications || [];
        setNotifications(data);
        await cacheService.saveNotifications(data);
      } else {
        const cached = await cacheService.getNotifications();
        setNotifications(cached || []);
      }
    } catch (error: any) {
      console.error('Notifications error:', error.response?.data || error.message);
      const cached = await cacheService.getNotifications();
      setNotifications(cached || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [isConnected]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [isConnected]);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const formatCurrency = (val: number) => {
    if (!val) return '';
    return '₹' + Math.abs(val).toLocaleString('en-IN');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>{t('alerts.title')}</Text>
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>{unreadCount}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {loading ? (
          <AlertsSkeleton />
        ) : notifications.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name="notifications-off-outline" size={36} color={colors.textSecondary} />
            </View>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{t('all.caught.up')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('no.notifications')}</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}>
            {notifications.map((item, idx) => {
              const isMilk = item.type?.toLowerCase()?.includes('milk') || item.type?.toLowerCase()?.includes('entry');
              const title = item.title || 'Notification';
              const message = item.message || '';
              const timeAgo = formatTimeAgo(item.created_at);
              const amountText = item.amount ? formatCurrency(item.amount) : null;
              
              return (
                <View 
                  key={item.id || idx}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'flex-start', 
                    paddingVertical: 16, 
                    borderTopWidth: idx !== 0 ? 1 : 0, 
                    borderTopColor: colors.border
                  }}
                >
                  <View 
                    style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 20, 
                      backgroundColor: isMilk ? '#e0e7ff' : '#ecfdf5',
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <Ionicons name={isMilk ? 'water-outline' : 'card-outline'} size={18} color={isMilk ? '#4f46e5' : '#10b981'} />
                  </View>
                  
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14, flex: 1 }}>{title}</Text>
                      {!item.is_read && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 }} />
                      )}
                    </View>
                    {message ? (
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 }}>{message}</Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      {timeAgo ? <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{timeAgo}</Text> : <View />}
                      {item.amount ? (
                        <Text style={{ color: colors.success, fontWeight: '600', fontSize: 13 }}>{formatCurrency(item.amount)}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
