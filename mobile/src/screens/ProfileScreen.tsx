import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { User, Phone, CreditCard, LogOut, ChevronRight, Settings, HelpCircle, Shield, Bell } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts', color: '#6366f1' },
        { icon: Shield, label: 'Privacy', subtitle: 'Data & security', color: '#10b981' },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', subtitle: 'FAQs & support', color: '#f59e0b' },
        { icon: Settings, label: 'Settings', subtitle: 'App preferences', color: '#64748b' },
      ]
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      
      {/* Profile Header */}
      <LinearGradient
        colors={['#4f46e5', '#7c3aed']}
        className="px-6 pt-6 pb-10"
      >
        <Text className="text-white/70 text-sm mb-6">Profile</Text>
        
        <View className="flex-row items-center">
          <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center border-2 border-white/30">
            <Text className="text-white text-3xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View className="ml-5 flex-1">
            <Text className="text-white text-2xl font-bold">{user?.name || 'Customer'}</Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
                <CreditCard size={12} color="white" {...({} as any)} />
                <Text className="text-white/90 text-xs ml-1.5 font-medium">
                  ID: {user?.amcuId || user?.id || '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 -mt-4" showsVerticalScrollIndicator={false}>
        {/* Contact Card */}
        <View className="mx-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-slate-50 rounded-xl items-center justify-center">
              <Phone size={22} color="#64748b" {...({} as any)} />
            </View>
            <View className="ml-4">
              <Text className="text-slate-400 text-xs font-medium">Phone Number</Text>
              <Text className="text-slate-900 text-lg font-bold">{user?.phone || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sIdx) => (
          <View key={sIdx} className="mb-6">
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest px-6 mb-3">
              {section.section}
            </Text>
            <View className="mx-6 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {section.items.map((item, iIdx) => (
                <TouchableOpacity 
                  key={iIdx}
                  className={`flex-row items-center p-4 ${iIdx !== 0 ? 'border-t border-slate-50' : ''}`}
                >
                  <View 
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{ backgroundColor: item.color + '15' }}
                  >
                    <item.icon size={22} color={item.color} {...({} as any)} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-slate-900 font-semibold">{item.label}</Text>
                    <Text className="text-slate-400 text-xs mt-0.5">{item.subtitle}</Text>
                  </View>
                  <ChevronRight size={20} color="#cbd5e1" {...({} as any)} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity 
            onPress={handleLogout}
            className="bg-red-50 border border-red-100 rounded-2xl p-4 flex-row items-center justify-center"
          >
            <LogOut size={20} color="#ef4444" {...({} as any)} />
            <Text className="text-red-500 font-bold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center pb-8">
          <Text className="text-slate-300 text-xs">My Dairy App v1.0.0</Text>
        </View>
        
        {/* Bottom Padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
