import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

interface UsePushNotificationsOptions {
  onNotificationReceived?: (notification: PushNotificationSchema) => void;
  onNotificationAction?: (action: ActionPerformed) => void;
}

export const usePushNotifications = (options?: UsePushNotificationsOptions) => {
  const { onNotificationReceived, onNotificationAction } = options || {};

  // Register FCM token with backend
  const registerTokenWithBackend = useCallback(async (token: string) => {
    try {
      // Get token from localStorage or sessionStorage (matching AuthContext keys)
      const authToken = localStorage.getItem('dairy_app_token') || sessionStorage.getItem('dairy_app_token');
      if (!authToken) {
        console.log('No auth token found, skipping FCM registration');
        return;
      }

      console.log('Registering FCM token with backend...');
      const response = await fetch(`${API_BASE}/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token,
          deviceInfo: `${Capacitor.getPlatform()} - ${navigator.userAgent.substring(0, 100)}`
        })
      });

      if (response.ok) {
        console.log('FCM token registered successfully');
        localStorage.setItem('fcm_token', token);
      } else {
        console.error('Failed to register FCM token:', await response.text());
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }, []);

  // Initialize push notifications
  const initPushNotifications = useCallback(async () => {
    // Only run on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    try {
      // Request permission
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const newStatus = await PushNotifications.requestPermissions();
        if (newStatus.receive !== 'granted') {
          console.log('Push notification permission denied');
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Add listeners
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        registerTokenWithBackend(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        onNotificationReceived?.(notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        onNotificationAction?.(action);
      });

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }, [registerTokenWithBackend, onNotificationReceived, onNotificationAction]);

  // Unregister token when logging out
  const unregisterToken = useCallback(async () => {
    const fcmToken = localStorage.getItem('fcm_token');
    const authToken = localStorage.getItem('dairy_app_token') || sessionStorage.getItem('dairy_app_token');
    
    if (!fcmToken || !authToken) return;

    try {
      await fetch(`${API_BASE}/notifications/unregister`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ token: fcmToken })
      });
      
      localStorage.removeItem('fcm_token');
      console.log('FCM token unregistered');
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initPushNotifications();

    return () => {
      // Cleanup listeners on unmount
      PushNotifications.removeAllListeners();
    };
  }, [initPushNotifications]);

  return {
    initPushNotifications,
    unregisterToken
  };
};

export default usePushNotifications;
