import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { customerPortalApi } from '../lib/api';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export default function LoginScreen() {
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Focus states for "floating" label effect (simulated with border color)
  const [idFocused, setIdFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center', maxWidth: 450, width: '100%', alignSelf: 'center' }}>
          
          {/* Header Section */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={{ width: 48, height: 48, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 24, fontWeight: '400', color: '#202124', marginBottom: 8 }}>
              Sign in
            </Text>
            <Text style={{ fontSize: 16, color: '#202124' }}>
              to continue to <Text style={{ fontWeight: '500' }}>My Dairy</Text>
            </Text>
          </View>

          {/* Form Section */}
          <View>
            {/* Customer ID Input */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ 
                borderWidth: 1, 
                borderColor: idFocused ? '#1a73e8' : '#dadce0', 
                borderRadius: 4, 
                paddingHorizontal: 13,
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                height: 56,
                justifyContent: 'center'
              }}>
                <TextInput
                  style={{ fontSize: 16, color: '#202124' }}
                  placeholder="Customer ID or Phone"
                  placeholderTextColor="#5f6368"
                  value={customerId}
                  onChangeText={setCustomerId}
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                  autoCapitalize="none"
                  keyboardType="default"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ 
                borderWidth: 1, 
                borderColor: passFocused ? '#1a73e8' : '#dadce0', 
                borderRadius: 4, 
                paddingHorizontal: 13,
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                height: 56,
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <TextInput
                  style={{ flex: 1, fontSize: 16, color: '#202124' }}
                  placeholder="Enter your password"
                  placeholderTextColor="#5f6368"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#5f6368" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <View style={{ marginBottom: 40, alignItems: 'flex-start' }}>
              <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
                <Text style={{ color: '#1a73e8', fontSize: 14, fontWeight: '500' }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
              {/* Optional: Create account link could go here if needed 
              <TouchableOpacity>
                 <Text style={{ color: '#1a73e8', fontSize: 14, fontWeight: '500' }}>Create account</Text>
              </TouchableOpacity> 
              */}
              
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading}
                style={{ 
                  backgroundColor: '#1a73e8', 
                  paddingVertical: 10, 
                  paddingHorizontal: 24, 
                  borderRadius: 4,
                  minWidth: 80,
                  alignItems: 'center',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '500', fontSize: 14 }}>Next</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        visible={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />
    </KeyboardAvoidingView>
  );
}
