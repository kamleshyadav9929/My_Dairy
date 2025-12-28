import "./global.css";
import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { I18nProvider, useI18n } from './src/context/I18nContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PassbookScreen from './src/screens/PassbookScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AlertsScreen from './src/screens/AlertsScreen';
import { registerForPushNotificationsAsync } from './src/lib/notificationUtils';
import { customerPortalApi } from './src/lib/api';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { t } = useI18n();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_500Medium',
        },
        tabBarIcon: ({ color, focused, size }) => {
          let iconName: any;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Passbook') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarLabel: ({ focused }) => {
          let label = '';
          if (route.name === 'Home') label = t('nav.home');
          else if (route.name === 'Passbook') label = t('nav.passbook');
          else if (route.name === 'Alerts') label = t('nav.alerts');
          else if (route.name === 'Profile') label = t('nav.profile');
          return (
            <Text style={{ 
              fontSize: 10, 
              fontFamily: 'Inter_500Medium',
              color: focused ? colors.primary : colors.textSecondary
            }}>
              {label}
            </Text>
          );
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
  const { colors, isDark } = useTheme();

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const defaultFontStyle = { fontFamily: 'Inter_400Regular' };
  const originalRender = Text.render;
  Text.render = function (...args: any) {
    const origin = originalRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [defaultFontStyle, origin.props.style],
    });
  };

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <ThemeProvider>
          <StatusBar backgroundColor="#ffffff" barStyle="dark-content" translucent={false} />
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AuthProvider>
              <Navigation />
            </AuthProvider>
          </View>
        </ThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
