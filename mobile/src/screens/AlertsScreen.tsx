import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { customerPortalApi } from '../lib/api';
import { BlurView } from 'expo-blur';

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
    const now = new Date();
    const date = new Date(dateStr);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getEmoji = (type: string) => {
    if (type === 'PAYMENT' || type === 'payment') return '💰';
    if (type === 'MILK' || type === 'entry') return '🥛';
    return '🔔';
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      
      {/* Ambient Effects */}
      <View className="absolute top-40 right-0 w-80 h-80 rounded-full opacity-15" style={{ backgroundColor: '#f59e0b', transform: [{ translateX: 120 }] }} />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-2xl font-bold">🔔 Notifications</Text>
              {unreadCount > 0 && (
                <Text className="text-indigo-400 text-sm mt-1">{unreadCount} unread</Text>
              )}
            </View>
          </View>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          <View className="px-6">
            {loading ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#6366f1" />
              </View>
            ) : notifications.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Text className="text-6xl mb-4">✨</Text>
                <Text className="text-white font-bold text-lg">All caught up!</Text>
                <Text className="text-white/40 mt-2 text-center">No new notifications</Text>
              </View>
            ) : (
              <>
                <Text className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4">Recent</Text>
                
                {notifications.map((item) => (
                  <View 
                    key={item.id} 
                    className="mb-3 rounded-2xl overflow-hidden"
                    style={{ backgroundColor: item.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.08)' }}
                  >
                    <BlurView intensity={10} tint="dark" className="p-4">
                      <View className="flex-row items-start">
                        <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center">
                          <Text className="text-2xl">{getEmoji(item.type)}</Text>
                        </View>
                        
                        <View className="flex-1 ml-4">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-white font-bold text-sm flex-1" numberOfLines={1}>
                              {item.title}
                            </Text>
                            <View className="flex-row items-center ml-2">
                              <Text className="text-white/30 text-xs">⏱ {formatTimeAgo(item.created_at)}</Text>
                            </View>
                          </View>
                          
                          <Text className="text-white/50 text-sm" numberOfLines={2}>
                            {item.message}
                          </Text>
                          
                          {item.amount && (
                            <View className="mt-3 self-start px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                              <Text className="text-emerald-400 font-bold text-sm">
                                ₹{item.amount.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        {!item.is_read && (
                          <View className="w-2.5 h-2.5 bg-indigo-500 rounded-full ml-2 mt-1" />
                        )}
                      </View>
                    </BlurView>
                  </View>
                ))}
              </>
            )}
          </View>
          
          <View className="h-28" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
