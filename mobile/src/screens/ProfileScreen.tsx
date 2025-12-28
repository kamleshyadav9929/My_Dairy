import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { User, Phone, MapPin, Hash, Milk, Globe, Info, LogOut, ChevronRight, FileText, Calendar } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    customerPortalApi.getProfile().then(res => {
      setProfile(res.data);
    }).catch(err => console.error('Get profile error:', err));
  }, []);

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

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <View className="flex-row items-center py-3.5 border-b border-slate-50 last:border-0">
      <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center">
        <Icon size={20} color="#64748b" {...({} as any)} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-slate-400 text-xs text font-medium">{label}</Text>
        <Text className="text-slate-900 font-semibold text-base mt-0.5">{value || 'N/A'}</Text>
      </View>
    </View>
  );

  const SettingsRow = ({ icon: Icon, label, onPress, rightText }: any) => (
    <TouchableOpacity onPress={onPress || (() => {})} className="flex-row items-center py-4 border-b border-slate-50 last:border-0">
      <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center">
        <Icon size={20} color="#64748b" {...({} as any)} />
      </View>
      <Text className="ml-4 flex-1 text-slate-900 font-bold text-base">{label}</Text>
      {rightText && <Text className="text-slate-400 text-sm mr-2">{rightText}</Text>}
      <ChevronRight size={18} color="#cbd5e1" {...({} as any)} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View className="px-6 py-4 bg-white border-b border-slate-100">
        <Text className="text-xl font-bold text-slate-900">My Profile</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-20">
        
        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex-row items-center mb-6">
           <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center">
              <User size={32} color="#94a3b8" {...({} as any)} />
           </View>
           <View className="ml-4">
              <Text className="text-xl font-bold text-slate-900">{user?.name || 'Customer'}</Text>
              <Text className="text-slate-500 font-medium">ID: {profile?.amcuId || user?.amcuId}</Text>
           </View>
        </View>

        {/* Personal Details */}
        <Text className="text-slate-900 font-bold text-sm mb-3 ml-1">Personal Details</Text>
        <View className="bg-white rounded-3xl px-5 py-2 border border-slate-100 shadow-sm mb-6">
           <InfoRow icon={Hash} label="Customer ID" value={profile?.amcuId || '1002'} />
           <InfoRow icon={Phone} label="Phone" value={profile?.phone} />
           <InfoRow icon={MapPin} label="Address" value={profile?.address || 'Not provided'} />
           <InfoRow icon={Milk} label="Milk Type" value={profile?.defaultMilkType} />
           <InfoRow icon={Calendar} label="Member since" value={profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '6 Dec 2025'} />
        </View>

        {/* Settings */}
        <Text className="text-slate-900 font-bold text-sm mb-3 ml-1">Settings</Text>
        <View className="bg-white rounded-3xl px-5 py-2 border border-slate-100 shadow-sm mb-8">
           <SettingsRow icon={Globe} label="App Language" rightText="English" />
           <SettingsRow icon={FileText} label="News" />
           <SettingsRow icon={Info} label="About Us" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
           onPress={handleLogout}
           className="flex-row items-center justify-center p-4 rounded-xl bg-white border border-slate-200 mb-10"
        >
           <LogOut size={20} color="#ef4444" className="mr-2" {...({} as any)} />
           <Text className="text-red-500 font-bold text-base">Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
