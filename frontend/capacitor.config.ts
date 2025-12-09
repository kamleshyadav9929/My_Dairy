import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mydairy.customer',
  appName: 'My Dairy',
  webDir: 'dist',
  server: {
    // For development: Use your computer's local IP (e.g., 'http://192.168.1.x:5000')
    // For production: Use your deployed backend URL
    // Comment out for pure local testing
    // url: 'http://YOUR_BACKEND_URL',
    cleartext: true, // Allow HTTP for development
  },
  android: {
    allowMixedContent: true, // Allow HTTP and HTTPS
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e293b',
      showSpinner: false,
    },
  },
};

export default config;
