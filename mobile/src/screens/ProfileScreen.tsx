import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      '👋 Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const menuItems = [
    { emoji: '🔔', label: 'Notifications', subtitle: 'Manage alerts' },
    { emoji: '🔒', label: 'Privacy', subtitle: 'Data & security' },
    { emoji: '❓', label: 'Help Center', subtitle: 'FAQs & support' },
    { emoji: '⚙️', label: 'Settings', subtitle: 'App preferences' },
  ];

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      
      {/* Ambient Effects */}
      <View className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20" style={{ backgroundColor: '#6366f1', transform: [{ translateX: -100 }, { translateY: -100 }] }} />
      <View className="absolute bottom-40 right-0 w-64 h-64 rounded-full opacity-15" style={{ backgroundColor: '#10b981', transform: [{ translateX: 80 }] }} />
      
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-4 pb-8">
            <Text className="text-white/40 text-sm font-medium">👤 Profile</Text>
          </View>

          {/* Profile Card */}
          <View className="mx-6 rounded-3xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <BlurView intensity={25} tint="dark" className="p-6">
              <View className="flex-row items-center">
                <View className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center" style={{ backgroundColor: '#6366f1' }}>
                  <Text className="text-white text-4xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View className="ml-5 flex-1">
                  <Text className="text-white text-2xl font-bold">{user?.name || 'Customer'}</Text>
                  <View className="flex-row items-center mt-2">
                    <View className="bg-white/10 px-3 py-1.5 rounded-full flex-row items-center border border-white/5">
                      <Text className="mr-1.5">🆔</Text>
                      <Text className="text-white/70 text-xs font-medium">
                        {user?.amcuId || user?.id || '-'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Phone */}
              <View className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/5 flex-row items-center">
                <Text className="text-2xl mr-3">📱</Text>
                <View>
                  <Text className="text-white/40 text-xs">Phone Number</Text>
                  <Text className="text-white font-bold text-lg">{user?.phone || 'Not set'}</Text>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Menu Items */}
          <View className="mx-6 mt-6">
            <Text className="text-white/30 text-xs font-bold uppercase tracking-widest mb-4">Settings</Text>
            
            <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity 
                  key={idx}
                  className={`flex-row items-center p-4 ${idx !== 0 ? 'border-t border-white/5' : ''}`}
                >
                  <View className="w-11 h-11 rounded-xl bg-white/5 items-center justify-center border border-white/5">
                    <Text className="text-xl">{item.emoji}</Text>
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-white font-semibold">{item.label}</Text>
                    <Text className="text-white/30 text-xs mt-0.5">{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout Button */}
          <View className="mx-6 mt-8 mb-8">
            <TouchableOpacity 
              onPress={handleLogout}
              className="rounded-2xl p-4 flex-row items-center justify-center border border-red-500/30"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <Text className="text-2xl mr-2">👋</Text>
              <Text className="text-red-400 font-bold">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <View className="items-center pb-8">
            <Text className="text-white/20 text-xs">My Dairy v1.0.0</Text>
          </View>
          
          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
