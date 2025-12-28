import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayCollection, setTodayCollection] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [passbook, setPassbook] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [summaryRes, todayRes, trendsRes, passbookRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getCollectionTrends(7),
        customerPortalApi.getPassbook({ from: '2020-01-01', to: new Date().toISOString().split('T')[0] }),
      ]);
      setDashboardData(summaryRes.data);
      setTodayCollection(todayRes.data);
      setTrends(trendsRes.data || []);
      setPassbook(passbookRes.data.summary || {});
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

  const formatCurrency = (val: number) => '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <SafeAreaView className="flex-1 bg-neutral-100">
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-4 bg-neutral-100">
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-center">
                <Ionicons name="sunny-outline" size={14} color="#737373" />
                <Text className="ml-1.5 text-neutral-500 text-xs">{getGreeting()}</Text>
              </View>
              <Text className="text-neutral-900 text-xl font-bold mt-0.5">{user?.name || 'Customer'}</Text>
            </View>
            <TouchableOpacity 
              onPress={onRefresh}
              className="w-10 h-10 rounded-full bg-white items-center justify-center border border-neutral-200"
            >
              <Ionicons name="refresh" size={18} color="#404040" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Card - Keeping your existing style */}
        <View className="mx-5 bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="wallet-outline" size={16} color="#737373" />
              <Text className="ml-2 text-neutral-500 text-xs font-medium">This Month</Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Passbook')}
              className="flex-row items-center"
            >
              <Text className="text-indigo-600 text-xs font-medium mr-1">View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-neutral-900 text-3xl font-bold">
            {formatCurrency(dashboardData?.totalAmount || 0)}
          </Text>
          <Text className="text-neutral-400 text-xs mt-1">Total Earnings</Text>
          
          <View className="flex-row mt-5 pt-4 border-t border-neutral-200">
            <View className="flex-1">
              <Text className="text-neutral-400 text-[10px] tracking-wide">MILK</Text>
              <Text className="text-neutral-900 text-base font-semibold mt-0.5">
                {(dashboardData?.totalMilkQty || 0).toFixed(1)} <Text className="text-xs text-neutral-400 font-normal">L</Text>
              </Text>
            </View>
            <View className="w-px bg-neutral-200" />
            <View className="flex-1 pl-4">
              <Text className="text-neutral-400 text-[10px] tracking-wide">DAYS</Text>
              <Text className="text-neutral-900 text-base font-semibold mt-0.5">
                {dashboardData?.pouringDays || 0}
              </Text>
            </View>
            <View className="w-px bg-neutral-200" />
            <View className="flex-1 pl-4">
              <Text className="text-neutral-400 text-[10px] tracking-wide">BALANCE</Text>
              <Text className="text-emerald-600 text-base font-semibold mt-0.5">
                {formatCurrency(passbook?.balance || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Today's Collection Card */}
        <View className="mx-5 mt-4 bg-white rounded-2xl p-5">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-neutral-900 text-base font-bold">Today's Collection</Text>
            <Text className="text-neutral-400 text-xs">{todayDate}</Text>
          </View>
          
          {/* Morning Row */}
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-amber-50 items-center justify-center">
              <Ionicons name="sunny" size={22} color="#f59e0b" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-neutral-900 font-semibold">Morning</Text>
              <Text className="text-neutral-400 text-xs mt-0.5">
                Fat: {todayCollection?.morning?.fat || '—'}% · SNF: {todayCollection?.morning?.snf || '—'}%
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-neutral-900 font-bold">
                {todayCollection?.morning?.quantity_litre?.toFixed(1) || '—'} L
              </Text>
              <Text className="text-emerald-600 text-sm font-semibold">
                {formatCurrency(todayCollection?.morning?.amount || 0)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-neutral-100 mb-4" />

          {/* Evening Row */}
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center">
              <Ionicons name="moon" size={20} color="#6366f1" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-neutral-900 font-semibold">Evening</Text>
              <Text className="text-neutral-400 text-xs mt-0.5">
                Fat: {todayCollection?.evening?.fat || '—'}% · SNF: {todayCollection?.evening?.snf || '—'}%
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-neutral-900 font-bold">
                {todayCollection?.evening?.quantity_litre?.toFixed(1) || '—'} L
              </Text>
              <Text className="text-emerald-600 text-sm font-semibold">
                {formatCurrency(todayCollection?.evening?.amount || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Collection Trends Card */}
        <View className="mx-5 mt-4 bg-white rounded-2xl p-5 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-neutral-900 text-base font-bold">Collection Trends</Text>
              <Text className="text-neutral-400 text-xs mt-0.5">Last 7 days</Text>
            </View>
            <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full">
              <Ionicons name="trending-up" size={12} color="#10b981" />
              <Text className="text-emerald-600 text-xs font-semibold ml-1">Active</Text>
            </View>
          </View>
          
          {/* Chart */}
          <View className="flex-row">
            {/* Y-axis labels */}
            <View className="w-6 justify-between pr-2 items-end" style={{ height: 100 }}>
              <Text className="text-neutral-300 text-[9px]">20</Text>
              <Text className="text-neutral-300 text-[9px]">15</Text>
              <Text className="text-neutral-300 text-[9px]">10</Text>
              <Text className="text-neutral-300 text-[9px]">5</Text>
            </View>
            
            {/* Bars */}
            <View className="flex-1 flex-row items-end justify-between" style={{ height: 100 }}>
              {(trends.length > 0 ? trends.slice(-7) : Array(7).fill({ totalQty: 0 })).map((day: any, i: number) => {
                const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 20);
                const height = ((day.totalQty || 0) / maxQty) * 80;
                const isToday = i === trends.slice(-7).length - 1;
                const dayName = day.date 
                  ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 3)
                  : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
                
                return (
                  <View key={i} className="items-center flex-1">
                    <View 
                      className={`w-8 rounded-lg ${isToday ? 'bg-indigo-500' : 'bg-indigo-100'}`}
                      style={{ height: Math.max(height, 8) }}
                    />
                    <Text className="text-neutral-400 text-[9px] mt-2 font-medium">{dayName}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
