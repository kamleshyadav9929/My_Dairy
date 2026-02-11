import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerPortalApi } from '../lib/api';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [customerId, setCustomerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!customerId.trim()) {
      Alert.alert('Error', 'Please enter your Customer ID or Phone');
      return;
    }

    setLoading(true);
    try {
      // Send password reset request to admin
      await customerPortalApi.requestPasswordReset(customerId.trim());
      setSubmitted(true);
    } catch (error: any) {
      console.error('Reset request failed:', error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'Failed to submit request. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCustomerId('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 }}
        onPress={handleClose}
      >
        <Pressable 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 24,
            padding: 24,
          }}
          onPress={() => {}}
        >
          {submitted ? (
            // Success State
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ 
                width: 64, 
                height: 64, 
                borderRadius: 32, 
                backgroundColor: '#ecfdf5', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 20
              }}>
                <Ionicons name="checkmark" size={32} color="#10b981" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#171717', marginBottom: 8 }}>
                Request Submitted!
              </Text>
              <Text style={{ fontSize: 14, color: '#737373', textAlign: 'center', lineHeight: 20 }}>
                Contact the dairy admin for your new password.
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  marginTop: 24,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  backgroundColor: '#4f46e5',
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Form State
            <>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 16, 
                  backgroundColor: '#eef2ff', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Ionicons name="key-outline" size={28} color="#4f46e5" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#171717', marginBottom: 4 }}>
                  Reset Password
                </Text>
                <Text style={{ fontSize: 13, color: '#737373', textAlign: 'center' }}>
                  Enter your Customer ID or Phone number
                </Text>
              </View>

              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#fafafa', 
                borderWidth: 1, 
                borderColor: '#e5e5e5', 
                borderRadius: 14, 
                paddingHorizontal: 14, 
                height: 52,
                marginBottom: 20
              }}>
                <Ionicons name="person-outline" size={18} color="#737373" />
                <TextInput
                  style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#171717' }}
                  placeholder="Customer ID / Phone"
                  placeholderTextColor="#a3a3a3"
                  value={customerId}
                  onChangeText={setCustomerId}
                  autoCapitalize="none"
                  keyboardType="default"
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: loading ? '#6366f1' : '#4f46e5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>Submit Request</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#737373', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
