import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
    } finally {
      setLoading(false);
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
    if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
  };

  const greeting = getGreeting();

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      
      {/* Ambient Light Effects */}
      <View className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#6366f1', transform: [{ translateX: 100 }, { translateY: -100 }], shadowColor: '#6366f1', shadowRadius: 150 }} />
      <View className="absolute bottom-40 left-0 w-64 h-64 rounded-full opacity-15" style={{ backgroundColor: '#f59e0b', transform: [{ translateX: -80 }], shadowColor: '#f59e0b', shadowRadius: 100 }} />
      
      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-sm">{greeting.emoji} {greeting.text}</Text>
                <Text className="text-white text-2xl font-bold mt-1">{user?.name || 'Customer'}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Profile')}
                className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center border border-white/10"
              >
                <Text className="text-2xl">{user?.name?.charAt(0)?.toUpperCase() || '👤'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Card - Glassmorphic */}
          <View className="mx-6 mt-6 rounded-3xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <BlurView intensity={20} tint="dark" className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-2">🥛</Text>
                  <Text className="text-white/60 text-sm font-medium">This Month</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Passbook')}
                  className="bg-white/10 px-4 py-2 rounded-full flex-row items-center"
                >
                  <Text className="text-white/80 text-xs mr-1">View All</Text>
                  <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-white/50 text-xs uppercase tracking-widest mb-1">Total Earnings</Text>
              <Text className="text-white text-5xl font-bold tracking-tight">
                {formatCurrency(dashboardData?.totalAmount || 0)}
              </Text>
              
              <View className="flex-row gap-4 mt-6">
                <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <Text className="text-2xl mb-2">💧</Text>
                  <Text className="text-white/50 text-xs">Total Milk</Text>
                  <Text className="text-white text-xl font-bold mt-1">
                    {(dashboardData?.totalMilkQty || 0).toFixed(1)} <Text className="text-sm font-normal text-white/40">L</Text>
                  </Text>
                </View>
                
                <View className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5">
                  <Text className="text-2xl mb-2">📅</Text>
                  <Text className="text-white/50 text-xs">Pouring Days</Text>
                  <Text className="text-white text-xl font-bold mt-1">
                    {dashboardData?.pouringDays || 0} <Text className="text-sm font-normal text-white/40">days</Text>
                  </Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Today's Collection */}
          <View className="px-6 mt-8">
            <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Today's Collection</Text>
            
            <View className="flex-row gap-4">
              {/* Morning */}
              <View className="flex-1 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
                <BlurView intensity={10} tint="dark" className="p-4">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-2xl mr-2">🌅</Text>
                    <Text className="text-amber-400/80 font-semibold text-sm">Morning</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">
                    {todayCollection?.morning?.quantity_litre?.toFixed(1) || '0.0'}
                    <Text className="text-sm text-white/40 font-normal"> L</Text>
                  </Text>
                  {todayCollection?.morning && (
                    <Text className="text-white/30 text-xs mt-1">
                      Fat {todayCollection.morning.fat}% • SNF {todayCollection.morning.snf}%
                    </Text>
                  )}
                </BlurView>
              </View>

              {/* Evening */}
              <View className="flex-1 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                <BlurView intensity={10} tint="dark" className="p-4">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-2xl mr-2">🌆</Text>
                    <Text className="text-indigo-400/80 font-semibold text-sm">Evening</Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">
                    {todayCollection?.evening?.quantity_litre?.toFixed(1) || '0.0'}
                    <Text className="text-sm text-white/40 font-normal"> L</Text>
                  </Text>
                  {todayCollection?.evening && (
                    <Text className="text-white/30 text-xs mt-1">
                      Fat {todayCollection.evening.fat}% • SNF {todayCollection.evening.snf}%
                    </Text>
                  )}
                </BlurView>
              </View>
            </View>
          </View>

          {/* Weekly Trend */}
          <View className="px-6 mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white/40 text-xs font-bold uppercase tracking-widest">7-Day Trend</Text>
              <Text className="text-2xl">📊</Text>
            </View>
            
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <BlurView intensity={10} tint="dark" className="p-5">
                <View className="flex-row items-end justify-between h-24">
                  {(trends.length > 0 ? trends.slice(-7) : Array(7).fill({ totalQty: 0 })).map((day: any, i: number) => {
                    const maxQty = Math.max(...trends.map((d: any) => d.totalQty || 0), 1);
                    const height = ((day.totalQty || 0) / maxQty) * 70;
                    const isToday = i === Math.min(trends.length - 1, 6);
                    return (
                      <View key={i} className="flex-1 items-center px-1">
                        <View 
                          className={`w-full rounded-lg ${isToday ? 'bg-indigo-500' : 'bg-white/10'}`}
                          style={{ height: Math.max(height, 6) }}
                        />
                        <Text className="text-white/30 text-[9px] mt-2 font-medium">
                          {day.date ? new Date(day.date).toLocaleDateString('en-IN', { weekday: 'narrow' }) : '-'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </BlurView>
            </View>
          </View>

          {/* Quality Stats */}
          <View className="px-6 mt-8 mb-8">
            <Text className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Quality Metrics</Text>
            
            <View className="flex-row gap-4">
              <View className="flex-1 rounded-2xl p-5 border border-emerald-500/20" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">🧈</Text>
                  <Text className="text-emerald-400 text-xs font-bold">AVG FAT</Text>
                </View>
                <Text className="text-white text-3xl font-bold">
                  {(dashboardData?.avgFat || 0).toFixed(1)}<Text className="text-lg text-white/40">%</Text>
                </Text>
              </View>
              <View className="flex-1 rounded-2xl p-5 border border-cyan-500/20" style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)' }}>
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">🔬</Text>
                  <Text className="text-cyan-400 text-xs font-bold">AVG SNF</Text>
                </View>
                <Text className="text-white text-3xl font-bold">
                  {(dashboardData?.avgSnf || 0).toFixed(1)}<Text className="text-lg text-white/40">%</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Padding */}
          <View className="h-28" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
