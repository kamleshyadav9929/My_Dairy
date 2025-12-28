import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { useI18n } from '../context/I18nContext';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();
  const { language } = useI18n();

  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) return null;

  const message = language === 'hi' 
    ? 'इंटरनेट कनेक्शन नहीं है। ऑफ़लाइन डेटा दिखाया जा रहा है।'
    : 'No internet connection. Showing offline data.';

  return (
    <View style={{
      backgroundColor: '#fef3c7',
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#fcd34d',
    }}>
      <Ionicons name="cloud-offline-outline" size={16} color="#b45309" />
      <Text style={{ marginLeft: 8, color: '#b45309', fontSize: 12, fontWeight: '500' }}>
        {message}
      </Text>
    </View>
  );
}
