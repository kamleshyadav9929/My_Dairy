import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { Bell, CreditCard, Milk, ChevronRight, Clock } from 'lucide-react-native';
import { customerPortalApi } from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  amount?: number;
  entry_date?: string;
}

export default function AlertsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await customerPortalApi.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error('Fetch notifications error:', error);
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
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getIcon = (type: string) => {
    if (type === 'PAYMENT' || type === 'payment') {
      return <CreditCard size={20} color="#64748b" {...({} as any)} />;
    }
    return <Milk size={20} color="#64748b" {...({} as any)} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View className="px-6 py-6 border-b border-slate-100 bg-white">
        <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />}
      >
        <View className="px-6 py-4">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Earlier</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4f46e5" className="mt-10" />
          ) : notifications.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Bell size={48} color="#cbd5e1" {...({} as any)} />
              <Text className="text-slate-400 mt-4 font-medium">No notifications yet</Text>
            </View>
          ) : (
            notifications.map((item) => (
              <View 
                key={item.id} 
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200/60 shadow-sm"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-start flex-1">
                    <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center border border-slate-100">
                      {getIcon(item.type)}
                    </View>
                    <View className="ml-4 flex-1">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-bold text-slate-900 text-sm">{item.title}</Text>
                        <View className="flex-row items-center">
                          <Clock size={12} color="#94a3b8" />
                          <Text className="text-slate-400 text-[10px] ml-1 font-medium">{formatTimeAgo(item.created_at)}</Text>
                        </View>
                      </View>
                      <Text className="text-slate-500 text-xs leading-4 mb-2">{item.message}</Text>
                      {item.amount && (
                        <View className="bg-slate-50 self-start px-3 py-1.5 rounded-lg border border-slate-100">
                          <Text className="text-slate-900 font-bold text-xs">₹{item.amount.toLocaleString('en-IN')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
