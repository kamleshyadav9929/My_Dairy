// LocalStorage caching utility with expiry support

const CACHE_PREFIX = 'mydairy_cache_';
const DEFAULT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

export function setCache<T>(key: string, data: T, expiryMs: number = DEFAULT_EXPIRY_MS): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiryMs,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
  } catch (error) {
    console.warn('Failed to set cache:', error);
  }
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const cacheItem: CacheItem<T> = JSON.parse(raw);
    const now = Date.now();
    
    // Check if expired
    if (now - cacheItem.timestamp > cacheItem.expiryMs) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
}

export function getCacheIgnoreExpiry<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const cacheItem: CacheItem<T> = JSON.parse(raw);
    return cacheItem.data;
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
}

export function clearCache(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      // Clear all cache items
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
}

// Cache keys
export const CACHE_KEYS = {
  DASHBOARD_SUMMARY: 'dashboard_summary',
  DASHBOARD_TODAY: 'dashboard_today',
  DASHBOARD_PAYMENTS: 'dashboard_payments',
  DASHBOARD_CHART: 'dashboard_chart',
  PASSBOOK_ENTRIES: 'passbook_entries',
  PROFILE: 'profile',
  NOTIFICATIONS: 'notifications',
  // New dashboard keys (matching mobile cache structure)
  DASHBOARD: 'customer_dashboard',
  TODAY_COLLECTION: 'customer_today_collection',
  TRENDS: 'customer_trends',
  PASSBOOK_SUMMARY: 'customer_passbook_summary',
  RECENT_PAYMENTS: 'customer_recent_payments',
};
