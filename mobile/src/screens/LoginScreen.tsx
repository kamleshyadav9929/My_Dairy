import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

      if (response.data.token && response.data.customer) {
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
      style={{ flex: 1, backgroundColor: '#ffffff' }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 }}>
          {/* Logo/Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              backgroundColor: '#4f46e5', 
              borderRadius: 24, 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 24
            }}>
              <Ionicons name="water" size={40} color="#ffffff" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#171717', marginBottom: 8 }}>
              Welcome Back
            </Text>
            <Text style={{ fontSize: 14, color: '#737373', textAlign: 'center' }}>
              Login to your dairy account{'\n'}to view entries and payments
            </Text>
          </View>

          {/* Form */}
          <View>
            {/* Customer ID Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#525252', marginBottom: 8, marginLeft: 4 }}>
                Customer ID / Phone
              </Text>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#fafafa', 
                borderWidth: 1, 
                borderColor: '#e5e5e5', 
                borderRadius: 16, 
                paddingHorizontal: 16, 
                height: 56 
              }}>
                <Ionicons name="person-outline" size={20} color="#737373" />
                <TextInput
                  style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#171717' }}
                  placeholder="Enter your ID"
                  placeholderTextColor="#a3a3a3"
                  value={customerId}
                  onChangeText={setCustomerId}
                  autoCapitalize="none"
                  keyboardType="default"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#525252', marginBottom: 8, marginLeft: 4 }}>
                Password
              </Text>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#fafafa', 
                borderWidth: 1, 
                borderColor: '#e5e5e5', 
                borderRadius: 16, 
                paddingHorizontal: 16, 
                height: 56 
              }}>
                <Ionicons name="lock-closed-outline" size={20} color="#737373" />
                <TextInput
                  style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#171717' }}
                  placeholder="Enter password"
                  placeholderTextColor="#a3a3a3"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#737373" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              onPress={handleLogin}
              disabled={loading}
              style={{ 
                height: 56, 
                borderRadius: 16, 
                backgroundColor: loading ? '#6366f1' : '#4f46e5', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 'auto', alignItems: 'center', paddingTop: 32 }}>
            <Text style={{ color: '#737373', fontSize: 14 }}>Don't have an account?</Text>
            <TouchableOpacity style={{ marginTop: 4 }}>
              <Text style={{ color: '#4f46e5', fontWeight: '600', fontSize: 14 }}>Contact Administrator</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
