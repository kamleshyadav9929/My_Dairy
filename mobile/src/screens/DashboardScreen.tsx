import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar, Image } from 'react-native';
import { User, RefreshCw, Milk, Calendar, Sun, Moon, ArrowRight, IndianRupee, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayCollection, setTodayCollection] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [summaryRes, todayRes, trendsRes, paymentsRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getCollectionTrends(7),
        customerPortalApi.getPayments({ limit: 1 })
      ]);
      
      setDashboardData(summaryRes.data);
      setTodayCollection(todayRes.data);
      setTrends(trendsRes.data);
      setRecentPayments(paymentsRes.data.payments || []);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const formatCurrency = (val: number) => {
    return '₹' + (val || 0).toLocaleString('en-IN');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMaxTrend = () => {
    if (!trends.length) return 1;
    return Math.max(...trends.map(t => t.totalQty));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View className="px-5 py-4 flex-row justify-between items-start">
        <View>
          <View className="flex-row items-center space-x-2">
            <Moon size={14} color="#64748b" {...({} as any)} />
            <Text className="text-slate-500 text-sm font-medium">{getGreeting()}</Text>
          </View>
          <Text className="text-slate-900 text-2xl font-bold mt-1">{user?.name || 'Customer'}</Text>
        </View>
        <TouchableOpacity 
          onPress={onRefresh}
          className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm"
        >
          <RefreshCw size={20} color="#64748b" className={refreshing ? 'animate-spin' : ''} {...({} as any)} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        {/* Total Earnings Hero Card (Fallback Solid View) */}
        <View
          className="rounded-3xl p-6 mt-2 shadow-lg shadow-slate-300 bg-slate-800"
        >
          <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">Total Earnings (Month)</Text>
          <Text className="text-white text-4xl font-bold mb-6">{formatCurrency(dashboardData?.totalAmount)}</Text>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/10 rounded-2xl p-4 border border-white/5">
              <View className="w-8 h-8 bg-white/10 rounded-lg items-center justify-center mb-2">
                <Milk size={16} color="#e2e8f0" {...({} as any)} />
              </View>
              <Text className="text-slate-300 text-xs">Total Milk</Text>
              <Text className="text-white text-xl font-bold mt-1">{dashboardData?.totalMilkQty?.toFixed(1) || '0.0'} <Text className="text-sm font-normal text-slate-400">L</Text></Text>
            </View>
            <View className="flex-1 bg-white/10 rounded-2xl p-4 border border-white/5">
              <View className="w-8 h-8 bg-white/10 rounded-lg items-center justify-center mb-2">
                <Calendar size={16} color="#e2e8f0" {...({} as any)} />
              </View>
              <Text className="text-slate-300 text-xs">Days</Text>
              <Text className="text-white text-xl font-bold mt-1">{dashboardData?.pouringDays || 0} <Text className="text-sm font-normal text-slate-400">days</Text></Text>
            </View>
          </View>
        </View>

        {/* Today's Collection */}
        <View className="mt-6 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-slate-900 font-bold text-lg">Today's Collection</Text>
            <Text className="text-slate-400 text-xs font-medium">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
          </View>

          {/* Morning Row */}
          <View className="flex-row items-center py-2">
            <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mr-4">
              <Sun size={24} color="#f59e0b" {...({} as any)} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-base">Morning</Text>
              <Text className="text-slate-400 text-xs">
                {todayCollection?.morning?.qty > 0 
                  ? `${todayCollection.morning.qty}L • Fat: ${todayCollection.morning.fat}%` 
                  : 'No entry yet'}
              </Text>
            </View>
            <View> 
               {todayCollection?.morning?.amount > 0 ? (
                 <Text className="text-slate-900 font-bold text-base">{formatCurrency(todayCollection.morning.amount)}</Text>
               ) : (
                 <View className="w-8 h-[2px] bg-slate-200" />
               )}
            </View>
          </View>

          <View className="h-[1px] bg-slate-50 my-2" />

          {/* Evening Row */}
          <View className="flex-row items-center py-2">
            <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
              <Moon size={24} color="#6366f1" {...({} as any)} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-base">Evening</Text>
              <Text className="text-slate-400 text-xs">
                {todayCollection?.evening?.qty > 0 
                  ? `${todayCollection.evening.qty}L • Fat: ${todayCollection.evening.fat}%` 
                  : 'No entry yet'}
              </Text>
            </View>
            <View>
               {todayCollection?.evening?.amount > 0 ? (
                 <Text className="text-slate-900 font-bold text-base">{formatCurrency(todayCollection.evening.amount)}</Text>
               ) : (
                 <View className="w-8 h-[2px] bg-slate-200" />
               )}
            </View>
          </View>
        </View>

        {/* Collection Trends */}
        <View className="mt-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-slate-900 font-bold text-lg">Collection Trends</Text>
              <Text className="text-slate-400 text-xs">Last 7 days</Text>
            </View>
            <View className="bg-emerald-50 px-3 py-1 rounded-full flex-row items-center border border-emerald-100">
              <TrendingUp size={12} color="#10b981" {...({} as any)} />
              <Text className="text-emerald-700 text-xs font-bold ml-1">Active</Text>
            </View>
          </View>
          
          <View className="h-40 flex-row items-end justify-between px-2">
             {trends.map((item, index) => {
               const max = getMaxTrend();
               const heightPercent = max > 0 ? (item.totalQty / max) * 100 : 0;
               const dayName = new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
               
               return (
                 <View key={index} className="items-center flex-1">
                   <Text className="text-[10px] text-slate-400 mb-1">{item.totalQty}</Text>
                   <View 
                     style={{ height: `${Math.max(heightPercent, 5)}%` }} 
                     className="w-8 bg-indigo-500 rounded-t-lg" 
                   />
                   <Text className="text-[10px] text-slate-400 mt-2">{dayName}</Text>
                 </View>
               );
             })}
             {trends.length === 0 && (
                <View className="flex-1 items-center justify-center">
                   <Text className="text-slate-400">No data available</Text>
                </View>
             )}
          </View>
        </View>

        {/* Recent Payments */}
        <View className="mt-4 mb-20 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-slate-900 font-bold text-lg">Recent Payments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Passbook')}>
              <Text className="text-indigo-600 text-sm font-semibold flex-row items-center">
                View All <ArrowRight size={14} color="#4f46e5" {...({} as any)} />
              </Text>
            </TouchableOpacity>
          </View>
          
          {recentPayments.length > 0 ? (
            recentPayments.map((payment, index) => (
              <View key={index} className="bg-slate-50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 mb-2">
                 <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
                      <IndianRupee size={18} color="#059669" {...({} as any)} />
                    </View>
                    <View>
                      <Text className="text-slate-900 font-bold text-base">{formatCurrency(payment.amount)}</Text>
                      <Text className="text-slate-400 text-xs">{new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
                    </View>
                 </View>
                 <View className="bg-slate-200 px-3 py-1 rounded-lg">
                    <Text className="text-slate-600 text-xs font-bold uppercase">{payment.mode || 'CASH'}</Text>
                 </View>
              </View>
            ))
          ) : (
            <View className="py-4 items-center">
               <Text className="text-slate-400">No recent payments</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
