import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar, Animated } from 'react-native';
import { User, Milk, Calendar, Sun, Moon, ArrowRight, IndianRupee, TrendingUp, BarChart3, Droplets } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [todayCollection, setTodayCollection] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const [summaryRes, todayRes, trendsRes] = await Promise.all([
        customerPortalApi.getDashboard(),
        customerPortalApi.getTodayCollection(),
        customerPortalApi.getCollectionTrends(7),
      ]);
      
      console.log('Dashboard Response:', summaryRes.data);
      setDashboardData(summaryRes.data);
      setTodayCollection(todayRes.data);
      setTrends(trendsRes.data || []);
    } catch (error: any) {
      console.error('Fetch dashboard error:', error);
      console.error('Error details:', error.response?.data || error.message);
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

  const formatCurrency = (val: number) => '₹' + (val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate today's total from trends
  const todayTotal = todayCollection?.morning?.quantity_litre + todayCollection?.evening?.quantity_litre || 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        {/* Header with Greeting */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-slate-400 text-sm font-medium">{getGreeting()}</Text>
          <Text className="text-slate-900 text-2xl font-bold mt-1">{user?.name || 'Customer'}</Text>
        </View>

        {/* Main Stats Card - Glassmorphism */}
        <View className="mx-6 mb-6">
          <LinearGradient
            colors={['#4f46e5', '#7c3aed', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6 shadow-xl"
            style={{ borderRadius: 24 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white/90 text-xs font-bold">This Month</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Passbook')}
                className="bg-white/20 w-8 h-8 rounded-full items-center justify-center"
              >
                <ArrowRight size={16} color="white" {...({} as any)} />
              </TouchableOpacity>
            </View>
            
            <Text className="text-white/70 text-sm mb-1">Total Earnings</Text>
            <Text className="text-white text-4xl font-bold tracking-tight">
              {formatCurrency(dashboardData?.totalAmount || 0)}
            </Text>
            
            <View className="flex-row gap-4 mt-6">
              <View className="flex-1 bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <View className="w-9 h-9 bg-white/20 rounded-xl items-center justify-center mb-3">
                  <Droplets size={18} color="white" {...({} as any)} />
                </View>
                <Text className="text-white/70 text-xs">Total Milk</Text>
                <Text className="text-white text-xl font-bold mt-0.5">
                  {(dashboardData?.totalMilkQty || 0).toFixed(1)} <Text className="text-sm font-normal text-white/60">L</Text>
                </Text>
              </View>
              
              <View className="flex-1 bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <View className="w-9 h-9 bg-white/20 rounded-xl items-center justify-center mb-3">
                  <Calendar size={18} color="white" {...({} as any)} />
                </View>
                <Text className="text-white/70 text-xs">Pouring Days</Text>
                <Text className="text-white text-xl font-bold mt-0.5">
                  {dashboardData?.pouringDays || 0} <Text className="text-sm font-normal text-white/60">days</Text>
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Today's Collection */}
        <View className="px-6 mb-6">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Today's Collection</Text>
          
          <View className="flex-row gap-4">
            {/* Morning */}
            <View className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center">
                  <Sun size={20} color="#f59e0b" {...({} as any)} />
                </View>
                <Text className="ml-3 text-slate-600 font-semibold">Morning</Text>
              </View>
              <Text className="text-slate-900 text-2xl font-bold">
                {todayCollection?.morning?.quantity_litre?.toFixed(1) || '0.0'} 
                <Text className="text-sm text-slate-400 font-normal"> L</Text>
              </Text>
              {todayCollection?.morning && (
                <Text className="text-slate-400 text-xs mt-1">
                  Fat: {todayCollection.morning.fat}% • SNF: {todayCollection.morning.snf}%
                </Text>
              )}
            </View>

            {/* Evening */}
            <View className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center mb-3">
                <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center">
                  <Moon size={20} color="#6366f1" {...({} as any)} />
                </View>
                <Text className="ml-3 text-slate-600 font-semibold">Evening</Text>
              </View>
              <Text className="text-slate-900 text-2xl font-bold">
                {todayCollection?.evening?.quantity_litre?.toFixed(1) || '0.0'}
                <Text className="text-sm text-slate-400 font-normal"> L</Text>
              </Text>
              {todayCollection?.evening && (
                <Text className="text-slate-400 text-xs mt-1">
                  Fat: {todayCollection.evening.fat}% • SNF: {todayCollection.evening.snf}%
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Weekly Trend Chart */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weekly Trend</Text>
            <BarChart3 size={16} color="#94a3b8" {...({} as any)} />
          </View>
          
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <View className="flex-row items-end justify-between h-24">
              {trends.slice(-7).map((day: any, i: number) => {
                const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 1);
                const height = ((day.totalQty || 0) / maxQty) * 80;
                const isToday = i === trends.length - 1;
                return (
                  <View key={i} className="flex-1 items-center">
                    <View 
                      className={`w-6 rounded-t-lg ${isToday ? 'bg-indigo-500' : 'bg-slate-200'}`}
                      style={{ height: Math.max(height, 8) }}
                    />
                    <Text className="text-slate-400 text-[10px] mt-2 font-medium">
                      {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Quality Stats */}
        <View className="px-6 mb-8">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Average Quality</Text>
          
          <View className="flex-row gap-4">
            <View className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
              <Text className="text-emerald-600 text-xs font-bold mb-2">AVG FAT</Text>
              <Text className="text-slate-900 text-2xl font-bold">
                {(dashboardData?.avgFat || 0).toFixed(1)}<Text className="text-sm text-slate-400">%</Text>
              </Text>
            </View>
            <View className="flex-1 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
              <Text className="text-blue-600 text-xs font-bold mb-2">AVG SNF</Text>
              <Text className="text-slate-900 text-2xl font-bold">
                {(dashboardData?.avgSnf || 0).toFixed(1)}<Text className="text-sm text-slate-400">%</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
