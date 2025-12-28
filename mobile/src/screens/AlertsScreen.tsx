import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Bell, CreditCard, Milk, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react-native';
import { customerPortalApi } from '../lib/api';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const res = await customerPortalApi.getNotifications();
      console.log('Notifications response:', res.data);
      setNotifications(res.data.notifications || []);
    } catch (error: any) {
      console.error('Fetch notifications error:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getIconConfig = (type: string) => {
    if (type === 'PAYMENT' || type === 'payment') {
      return { icon: CreditCard, color: '#10b981', bg: 'bg-emerald-50', border: 'border-emerald-100' };
    }
    if (type === 'MILK' || type === 'entry') {
      return { icon: Milk, color: '#6366f1', bg: 'bg-indigo-50', border: 'border-indigo-100' };
    }
    return { icon: Bell, color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-100' };
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header with Gradient Accent */}
      <View className="bg-white border-b border-slate-100">
        <View className="px-6 py-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
              {unreadCount > 0 && (
                <Text className="text-indigo-500 text-sm font-medium mt-1">
                  {unreadCount} unread
                </Text>
              )}
            </View>
            <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center">
              <Bell size={24} color="#6366f1" {...({} as any)} />
            </View>
          </View>
        </View>
      </View>

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
        <View className="px-6 py-6">
          {loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-slate-400 mt-4">Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-slate-100 rounded-3xl items-center justify-center mb-4">
                <Sparkles size={40} color="#cbd5e1" {...({} as any)} />
              </View>
              <Text className="text-slate-900 font-bold text-lg">All caught up!</Text>
              <Text className="text-slate-400 mt-2 text-center">
                No new notifications.{'\n'}Check back later.
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Activity</Text>
              
              {notifications.map((item, index) => {
                const { icon: Icon, color, bg, border } = getIconConfig(item.type);
                const isFirst = index === 0;
                
                return (
                  <View 
                    key={item.id} 
                    className={`bg-white rounded-2xl p-4 mb-3 border ${item.is_read ? 'border-slate-100' : 'border-indigo-200'} shadow-sm`}
                    style={!item.is_read ? { backgroundColor: '#fafbff' } : {}}
                  >
                    <View className="flex-row items-start">
                      <View className={`w-12 h-12 rounded-2xl ${bg} items-center justify-center border ${border}`}>
                        <Icon size={22} color={color} {...({} as any)} />
                      </View>
                      
                      <View className="flex-1 ml-4">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="font-bold text-slate-900 text-sm flex-1" numberOfLines={1}>
                            {item.title}
                          </Text>
                          <View className="flex-row items-center ml-2">
                            <Clock size={12} color="#94a3b8" {...({} as any)} />
                            <Text className="text-slate-400 text-xs ml-1">{formatTimeAgo(item.created_at)}</Text>
                          </View>
                        </View>
                        
                        <Text className="text-slate-500 text-sm leading-5" numberOfLines={2}>
                          {item.message}
                        </Text>
                        
                        {item.amount && (
                          <View className="mt-3 bg-gradient-to-r from-emerald-50 to-teal-50 self-start px-4 py-2 rounded-xl border border-emerald-100">
                            <Text className="text-emerald-700 font-bold text-sm">
                              ₹{item.amount.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {!item.is_read && (
                        <View className="w-2.5 h-2.5 bg-indigo-500 rounded-full ml-2" />
                      )}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>
        
        {/* Bottom Padding */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
