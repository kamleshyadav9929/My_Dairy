import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  DASHBOARD: 'cached_dashboard',
  TODAY_COLLECTION: 'cached_today_collection',
  PASSBOOK: 'cached_passbook',
  NOTIFICATIONS: 'cached_notifications',
  TRENDS: 'cached_trends',
  PAYMENTS: 'cached_payments',
};

export const cacheService = {
  async saveDashboard(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.DASHBOARD, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving dashboard cache:', e);
    }
  },

  async getDashboard() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.DASHBOARD);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error getting dashboard cache:', e);
      return null;
    }
  },

  async saveTodayCollection(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.TODAY_COLLECTION, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving today collection cache:', e);
    }
  },

  async getTodayCollection() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TODAY_COLLECTION);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error getting today collection cache:', e);
      return null;
    }
  },

  async savePassbook(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.PASSBOOK, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving passbook cache:', e);
    }
  },

  async getPassbook() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PASSBOOK);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error getting passbook cache:', e);
      return null;
    }
  },

  async saveNotifications(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.NOTIFICATIONS, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving notifications cache:', e);
    }
  },

  async getNotifications() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.NOTIFICATIONS);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error getting notifications cache:', e);
      return null;
    }
  },

  async saveTrends(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.TRENDS, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving trends cache:', e);
    }
  },

  async getTrends() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TRENDS);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error getting trends cache:', e);
      return null;
    }
  },

  async savePayments(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.PAYMENTS, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving payments cache:', e);
    }
  },

  async getPayments() {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PAYMENTS);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      console.error('Error getting payments cache:', e);
      return null;
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  },
};
