import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4f46e5',
    });
  }

  if (Device.isDevice) {
    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      console.log('Push notifications are not supported in Expo Go (SDK 53+). Use a development build.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Project ID is required for Expo Push Notifications
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.owner;
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      console.log('Push Token:', token);
    } catch (e) {
      console.error('Error fetching push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
