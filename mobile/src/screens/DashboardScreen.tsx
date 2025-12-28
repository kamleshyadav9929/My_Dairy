import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayCollection, setTodayCollection] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [summaryRes, todayRes, trendsRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getCollectionTrends(7),
      ]);
      setDashboardData(summaryRes.data);
      setTodayCollection(todayRes.data);
      setTrends(trendsRes.data || []);
    } catch (error: any) {
      console.error('Fetch error:', error.response?.data || error.message);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const formatCurrency = (val: number) => {
    const num = val || 0;
    if (num >= 10000) return '₹' + (num / 1000).toFixed(1) + 'K';
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-neutral-400 text-xs tracking-wide">{getGreeting()}</Text>
            <Text className="text-neutral-900 text-xl font-semibold mt-0.5">{user?.name || 'Customer'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')}
            className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
          >
            <Ionicons name="person" size={18} color="#404040" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View className="mx-5 mt-4 bg-neutral-900 rounded-2xl p-5">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-2">
                <Ionicons name="wallet-outline" size={16} color="#fff" />
              </View>
              <Text className="text-white/60 text-xs font-medium">This Month</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Passbook')}
              className="flex-row items-center"
            >
              <Text className="text-white/50 text-xs mr-1">Details</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-white/50 text-xs tracking-wide mb-1">TOTAL EARNINGS</Text>
          <Text className="text-white text-4xl font-bold tracking-tight" style={{ fontFamily: 'System' }}>
            {formatCurrency(dashboardData?.totalAmount || 0)}
          </Text>
          
          <View className="flex-row mt-5 pt-4 border-t border-white/10">
            <View className="flex-1">
              <Text className="text-white/40 text-[10px] tracking-wide">MILK</Text>
              <Text className="text-white text-lg font-semibold mt-0.5">
                {(dashboardData?.totalMilkQty || 0).toFixed(1)} <Text className="text-sm text-white/40">L</Text>
              </Text>
            </View>
            <View className="w-px bg-white/10" />
            <View className="flex-1 pl-4">
              <Text className="text-white/40 text-[10px] tracking-wide">DAYS</Text>
              <Text className="text-white text-lg font-semibold mt-0.5">
                {dashboardData?.pouringDays || 0}
              </Text>
            </View>
            <View className="w-px bg-white/10" />
            <View className="flex-1 pl-4">
              <Text className="text-white/40 text-[10px] tracking-wide">AVG FAT</Text>
              <Text className="text-white text-lg font-semibold mt-0.5">
                {(dashboardData?.avgFat || 0).toFixed(1)}<Text className="text-sm text-white/40">%</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Collection */}
        <View className="px-5 mt-6">
          <Text className="text-neutral-400 text-[10px] font-semibold tracking-widest mb-3">TODAY</Text>
          
          <View className="flex-row gap-3">
            <View className="flex-1 bg-amber-50 rounded-xl p-4 border border-amber-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="sunny-outline" size={16} color="#d97706" />
                <Text className="ml-2 text-amber-700 text-xs font-medium">Morning</Text>
              </View>
              <Text className="text-neutral-900 text-2xl font-bold">
                {todayCollection?.morning?.quantity_litre?.toFixed(1) || '—'}
                <Text className="text-sm text-neutral-400 font-normal"> L</Text>
              </Text>
            </View>

            <View className="flex-1 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <View className="flex-row items-center mb-2">
                <Ionicons name="moon-outline" size={16} color="#4f46e5" />
                <Text className="ml-2 text-indigo-700 text-xs font-medium">Evening</Text>
              </View>
              <Text className="text-neutral-900 text-2xl font-bold">
                {todayCollection?.evening?.quantity_litre?.toFixed(1) || '—'}
                <Text className="text-sm text-neutral-400 font-normal"> L</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Trend */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-neutral-400 text-[10px] font-semibold tracking-widest">7-DAY OVERVIEW</Text>
            <Ionicons name="analytics-outline" size={14} color="#a3a3a3" />
          </View>
          
          <View className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
            <View className="flex-row items-end justify-between h-16">
              {(trends.length > 0 ? trends.slice(-7) : Array(7).fill({ totalQty: 0 })).map((day: any, i: number) => {
                const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 1);
                const height = ((day.totalQty || 0) / maxQty) * 50;
                const isToday = i === Math.min(trends.length - 1, 6);
                return (
                  <View key={i} className="flex-1 items-center px-0.5">
                    <View 
                      className={`w-full max-w-[18px] rounded-sm ${isToday ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                      style={{ height: Math.max(height, 4) }}
                    />
                    <Text className="text-neutral-400 text-[8px] mt-1.5 font-medium">
                      {day.date ? ['S','M','T','W','T','F','S'][new Date(day.date).getDay()] : '·'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mt-6 mb-8">
          <Text className="text-neutral-400 text-[10px] font-semibold tracking-widest mb-3">QUICK ACCESS</Text>
          
          <View className="flex-row gap-3">
            {[
              { icon: 'document-text-outline', label: 'Passbook', screen: 'Passbook' },
              { icon: 'notifications-outline', label: 'Alerts', screen: 'Alerts' },
              { icon: 'person-outline', label: 'Profile', screen: 'Profile' },
            ].map((item, i) => (
              <TouchableOpacity 
                key={i}
                onPress={() => navigation.navigate(item.screen)}
                className="flex-1 bg-neutral-50 rounded-xl p-4 items-center border border-neutral-100"
              >
                <Ionicons name={item.icon as any} size={20} color="#525252" />
                <Text className="text-neutral-600 text-[10px] font-medium mt-2">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
