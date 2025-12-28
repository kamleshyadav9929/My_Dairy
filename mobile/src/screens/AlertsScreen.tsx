import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { customerPortalApi } from '../lib/api';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await customerPortalApi.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (error: any) {
      console.error('Notifications error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="px-5 pt-4 pb-4 border-b border-neutral-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-neutral-900 text-xl font-semibold">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-indigo-600 text-xs mt-0.5">{unreadCount} new</Text>
            )}
          </View>
          <TouchableOpacity className="w-9 h-9 rounded-full bg-neutral-100 items-center justify-center">
            <Ionicons name="settings-outline" size={16} color="#525252" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        <View className="px-5 py-4">
          {loading ? (
            <ActivityIndicator size="large" color="#171717" className="mt-10" />
          ) : notifications.length === 0 ? (
            <View className="items-center py-20">
              <Ionicons name="notifications-off-outline" size={48} color="#d4d4d4" />
              <Text className="text-neutral-900 font-semibold text-lg mt-4">All caught up</Text>
              <Text className="text-neutral-400 text-sm mt-1">No notifications right now</Text>
            </View>
          ) : (
            notifications.map((item, idx) => {
              const isMilk = item.type === 'MILK' || item.type === 'entry';
              return (
                <View 
                  key={item.id} 
                  className={`py-4 ${idx !== 0 ? 'border-t border-neutral-100' : ''}`}
                >
                  <View className="flex-row items-start">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isMilk ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                      <Ionicons name={isMilk ? 'water' : 'card'} size={18} color={isMilk ? '#4f46e5' : '#10b981'} />
                    </View>
                    
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-neutral-900 font-medium text-sm flex-1" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-neutral-400 text-[10px] ml-2">{formatTimeAgo(item.created_at)}</Text>
                      </View>
                      
                      <Text className="text-neutral-500 text-xs mt-1 leading-4" numberOfLines={2}>
                        {item.message}
                      </Text>
                      
                      {item.amount && (
                        <View className="mt-2 self-start bg-emerald-50 px-2.5 py-1 rounded-md">
                          <Text className="text-emerald-700 text-xs font-semibold">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {!item.is_read && (
                      <View className="w-2 h-2 bg-indigo-500 rounded-full ml-2 mt-1.5" />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
        
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
