import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mydairy.customer',
  appName: 'My Dairy',
  webDir: 'dist',
  
  // Server configuration
  server: {
    androidScheme: 'https', // Use HTTPS scheme for better security
    cleartext: true, // Allow HTTP for development
  },
  
  // Android specific optimizations
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: false, // Disable for production (faster)
    backgroundColor: '#f8fafc', // Match app background for seamless loading
    overrideUserAgent: 'MyDairy-Android-App', // Custom user agent
  },
  
  // Plugin configurations
  plugins: {
    // Splash screen - native feel
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#1e293b',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: false,
    },
    
    // Keyboard behavior
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    
    // Push notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    
    // Status bar
    StatusBar: {
      backgroundColor: '#1e293b',
      style: 'LIGHT',
      overlaysWebView: false,
    },
  },
};

export default config;

