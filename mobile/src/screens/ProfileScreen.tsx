import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  const menuSections = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: 'notifications-outline', label: 'Notifications' },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Security' },
        { icon: 'language-outline', label: 'Language' },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center' },
        { icon: 'chatbubble-outline', label: 'Contact Us' },
        { icon: 'document-text-outline', label: 'Terms of Service' },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6 border-b border-neutral-100">
          <Text className="text-neutral-900 text-xl font-semibold">Profile</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-5 mt-4 bg-neutral-50 rounded-2xl p-5 border border-neutral-100">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-neutral-900 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-neutral-900 text-lg font-semibold">{user?.name || 'Customer'}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-neutral-500 text-xs">ID: {user?.amcuId || user?.id || '-'}</Text>
              </View>
            </View>
            <TouchableOpacity className="w-9 h-9 rounded-full bg-white items-center justify-center border border-neutral-200">
              <Ionicons name="pencil-outline" size={14} color="#525252" />
            </TouchableOpacity>
          </View>
          
          <View className="mt-4 pt-4 border-t border-neutral-200">
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={16} color="#737373" />
              <Text className="ml-2 text-neutral-600 text-sm">{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} className="mt-6">
            <Text className="px-5 text-neutral-400 text-[10px] font-semibold tracking-widest mb-2">
              {section.title}
            </Text>
            <View className="mx-5 bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden">
              {section.items.map((item, iIdx) => (
                <TouchableOpacity 
                  key={iIdx}
                  className={`flex-row items-center px-4 py-3.5 ${iIdx > 0 ? 'border-t border-neutral-100' : ''}`}
                >
                  <Ionicons name={item.icon as any} size={18} color="#525252" />
                  <Text className="flex-1 ml-3 text-neutral-800 text-sm">{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#d4d4d4" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View className="mx-5 mt-8 mb-8">
          <TouchableOpacity 
            onPress={handleLogout}
            className="flex-row items-center justify-center py-3.5 rounded-xl bg-red-50 border border-red-100"
          >
            <Ionicons name="log-out-outline" size={18} color="#dc2626" />
            <Text className="ml-2 text-red-600 font-medium">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View className="items-center pb-6">
          <Text className="text-neutral-300 text-xs">My Dairy v1.0.0</Text>
        </View>
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
