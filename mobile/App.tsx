import "./global.css";
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ClipboardList, User as UserIcon, Bell } from 'lucide-react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PassbookScreen from './src/screens/PassbookScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import { registerForPushNotificationsAsync } from './src/lib/notificationUtils';
import { customerPortalApi } from './src/lib/api';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 15,
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home size={size} color={color} {...({} as any)} />;
          if (route.name === 'Passbook') return <ClipboardList size={size} color={color} {...({} as any)} />;
          if (route.name === 'Alerts') return <Bell size={size} color={color} {...({} as any)} />;
          if (route.name === 'Profile') return <UserIcon size={size} color={color} {...({} as any)} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Passbook" component={PassbookScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          customerPortalApi.savePushToken(token).catch(err => {
            console.warn('Failed to register push token with backend:', err);
          });
        }
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
