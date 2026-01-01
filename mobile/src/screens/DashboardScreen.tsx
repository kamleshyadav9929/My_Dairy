import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { useNetwork } from '../context/NetworkContext';
import { customerPortalApi } from '../lib/api';
import { cacheService } from '../lib/cacheService';
import { Ionicons } from '@expo/vector-icons';

import { DashboardSkeleton } from '../components/Skeleton';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const { isConnected } = useNetwork();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayCollection, setTodayCollection] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [passbook, setPassbook] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      if (isConnected) {
        // Fetch from API and cache
        const [summaryRes, todayRes, trendsRes, passbookRes, paymentsRes] = await Promise.all([
          customerPortalApi.getDashboard(),
          customerPortalApi.getTodayCollection(),
          customerPortalApi.getCollectionTrends(7),
          customerPortalApi.getPassbook({ from: '2020-01-01', to: new Date().toISOString().split('T')[0] }),
          customerPortalApi.getPayments({ limit: 3 }),
        ]);
        
        setDashboardData(summaryRes.data);
        setTodayCollection(todayRes.data);
        setTrends(trendsRes.data || []);
        setPassbook(passbookRes.data.summary || {});
        setRecentPayments(paymentsRes.data.payments || []);

        // Save to cache
        await cacheService.saveDashboard(summaryRes.data);
        await cacheService.saveTodayCollection(todayRes.data);
        await cacheService.saveTrends(trendsRes.data || []);
        await cacheService.savePassbook(passbookRes.data.summary || {});
        await cacheService.savePayments(paymentsRes.data.payments || []);
      } else {
        // Load from cache
        const [cachedDashboard, cachedToday, cachedTrends, cachedPassbook, cachedPayments] = await Promise.all([
          cacheService.getDashboard(),
          cacheService.getTodayCollection(),
          cacheService.getTrends(),
          cacheService.getPassbook(),
          cacheService.getPayments(),
        ]);
        
        setDashboardData(cachedDashboard);
        setTodayCollection(cachedToday);
        setTrends(cachedTrends || []);
        setPassbook(cachedPassbook);
        setRecentPayments(cachedPayments || []);
      }
    } catch (error: any) {
      console.error('Fetch error:', error.response?.data || error.message);
      // On error, try loading from cache
      const [cachedDashboard, cachedToday, cachedTrends, cachedPassbook, cachedPayments] = await Promise.all([
        cacheService.getDashboard(),
        cacheService.getTodayCollection(),
        cacheService.getTrends(),
        cacheService.getPassbook(),
        cacheService.getPayments(),
      ]);
      
      setDashboardData(cachedDashboard);
      setTodayCollection(cachedToday);
      setTrends(cachedTrends || []);
      setPassbook(cachedPassbook);
      setRecentPayments(cachedPayments || []);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isConnected]);

  const formatCurrency = (val: number) => '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [isConnected]);

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  // Calculate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const morningQty = todayCollection?.morning?.qty || todayCollection?.morning?.quantity_litre || 0;
  const eveningQty = todayCollection?.evening?.qty || todayCollection?.evening?.quantity_litre || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sunny-outline" size={14} color={colors.textSecondary} />
                <Text style={{ marginLeft: 6, color: colors.textSecondary, fontSize: 12 }}>{getGreeting()}</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 2 }}>{user?.name || 'Customer'}</Text>
            </View>
            <TouchableOpacity 
              onPress={onRefresh}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Card */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} />
              <Text style={{ marginLeft: 8, color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>{t('this.month')}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Passbook')}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '500', marginRight: 4 }}>{t('view.all')}</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>
            {formatCurrency(dashboardData?.totalAmount || 0)}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{t('total.earnings')}</Text>
          
          <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, letterSpacing: 1 }}>{t('total.milk').toUpperCase()}</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                {(dashboardData?.totalMilkQty || 0).toFixed(1)} <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '400' }}>L</Text>
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, letterSpacing: 1 }}>{t('pouring.days').toUpperCase()}</Text>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                {dashboardData?.pouringDays || 0}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 10, letterSpacing: 1 }}>{t('balance').toUpperCase()}</Text>
              <Text style={{ color: colors.success, fontSize: 16, fontWeight: '600', marginTop: 4 }}>
                {formatCurrency(passbook?.balance || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Collection Card */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{t('today.collection')}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{todayDate}</Text>
          </View>
          
          {/* Morning Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sunny" size={22} color="#f59e0b" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t('morning')}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {t('milk.fat')}: {todayCollection?.morning?.fat || '—'}% · {t('milk.snf')}: {todayCollection?.morning?.snf || '—'}%
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {morningQty > 0 ? `${morningQty.toFixed(1)} L` : '— L'}
              </Text>
              <Text style={{ color: colors.success, fontSize: 14, fontWeight: '600' }}>
                {formatCurrency(todayCollection?.morning?.amount || 0)}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

          {/* Evening Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="moon" size={20} color="#6366f1" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{t('evening')}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {t('milk.fat')}: {todayCollection?.evening?.fat || '—'}% · {t('milk.snf')}: {todayCollection?.evening?.snf || '—'}%
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {eveningQty > 0 ? `${eveningQty.toFixed(1)} L` : '— L'}
              </Text>
              <Text style={{ color: colors.success, fontSize: 14, fontWeight: '600' }}>
                {formatCurrency(todayCollection?.evening?.amount || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Collection Trends Card */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{t('collection.trends')}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{t('last.7.days')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Ionicons name="trending-up" size={12} color="#10b981" />
              <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{t('active')}</Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 24, justifyContent: 'space-between', paddingRight: 8, alignItems: 'flex-end', height: 100 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 9 }}>20</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9 }}>15</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9 }}>10</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 9 }}>5</Text>
            </View>
            
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 }}>
              {(trends.length > 0 ? trends.slice(-7) : Array(7).fill({ totalQty: 0 })).map((day: any, i: number) => {
                const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 20);
                const height = ((day.totalQty || 0) / maxQty) * 80;
                const isToday = i === trends.slice(-7).length - 1;
                const dayName = day.date 
                  ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)
                  : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
                
                return (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                    <View 
                      style={{ 
                        width: 32, 
                        borderRadius: 8, 
                        backgroundColor: isToday ? colors.primary : (isDark ? '#3f3f46' : '#e0e7ff'),
                        height: Math.max(height, 8)
                      }}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: 9, marginTop: 8, fontWeight: '500' }}>{dayName}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Recent Payments Card */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{t('recent.payments')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Passbook')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '500' }}>{t('see.all')}</Text>
            </TouchableOpacity>
          </View>
          
          {recentPayments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Ionicons name="card-outline" size={32} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>{t('no.payments')}</Text>
            </View>
          ) : (
            recentPayments.map((payment: any, idx: number) => (
              <View key={payment.id || idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: idx > 0 ? 16 : 0, paddingTop: idx > 0 ? 16 : 0, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="card" size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{t('payment.received')}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {new Date(payment.payment_date || payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={{ color: colors.success, fontWeight: '700' }}>
                  +{formatCurrency(payment.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
