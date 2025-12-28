import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';


// Production API URL - using Vercel deployment
const API_BASE = 'https://my-dairy-navy.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Using a placeholder for token storage (will implement with SecureStore/AsyncStorage later)
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const customerPortalApi = {
  login: (data: { customerIdOrPhone: string; password: string }) => api.post('/customer/auth/login', data),
  getDashboard: (params?: any) => api.get('/customer/me/summary', { params }),
  getTodayCollection: (params?: any) => api.get('/customer/me/today-collection', { params }),
  getCollectionTrends: (days = 7) => api.get('/customer/me/collection-trends', { params: { days } }),
  getPayments: (params?: any) => api.get('/customer/me/payments', { params }),
  getPassbook: (params: any) => api.get('/customer/me/passbook', { params }),
  getNotifications: (params?: any) => api.get('/customer/me/notifications', { params }),
  getProfile: () => api.get('/customer/me/profile'),
  savePushToken: (token: string) => api.post('/notifications/register', { token, platform: Platform.OS }),
};


export default api;
