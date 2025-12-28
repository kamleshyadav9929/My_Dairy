import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { Milk, Eye, EyeOff, User, Lock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';

export default function LoginScreen() {
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!customerId || !password) {
      Alert.alert('Error', 'Please enter both Customer ID and Password');
      return;
    }

    setLoading(true);
    try {
      const response = await customerPortalApi.login({
        customerIdOrPhone: customerId,
        password: password
      });

      // API returns { token, customer } on success
      if (response.data.token && response.data.customer) {
        // Map the response to expected format
        const user = {
          ...response.data.customer,
          customerId: response.data.customer.id,
        };
        await login(user, response.data.token);
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'Connection failed. Please check your internet.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950"
    >
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      {/* Decorative background */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <View className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-24 pb-10 justify-between">
          {/* Header */}
          <View className="items-center">
            <View className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl items-center justify-center mb-6 shadow-lg">
              <Milk color="white" size={40} {...({} as any)} />
            </View>
            <Text className="text-3xl font-bold text-white mb-2">Welcome Back</Text>
            <Text className="text-slate-400 text-center">
              Login to your dairy account to view entries and payments
            </Text>
          </View>

          {/* Form */}
          <View className="mt-10">
            <View className="mb-4">
              <Text className="text-sm font-medium text-slate-400 mb-2 px-1">Customer ID / Phone</Text>
              <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-4 h-14">
                <User size={20} color="#64748b" {...({} as any)} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  placeholder="Enter your ID"
                  placeholderTextColor="#64748b"
                  value={customerId}
                  onChangeText={setCustomerId}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-400 mb-2 px-1">Password</Text>
              <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-4 h-14">
                <Lock size={20} color="#64748b" {...({} as any)} />
                <TextInput
                  className="flex-1 ml-3 text-white text-base"
                  placeholder="Enter password"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#64748b" {...({} as any)} /> : <Eye size={20} color="#64748b" {...({} as any)} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              className={`h-14 rounded-2xl items-center justify-center ${loading ? 'bg-blue-700' : 'bg-blue-600'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center">
            <Text className="text-slate-500">Don't have an account?</Text>
            <TouchableOpacity className="mt-1">
              <Text className="text-blue-400 font-semibold">Contact Administrator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
