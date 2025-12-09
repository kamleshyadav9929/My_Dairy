import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dairy_app_token') || sessionStorage.getItem('dairy_app_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Auth error:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  adminLogin: (username: string, password: string) =>
    api.post('/auth/admin/login', { username, password }),
  customerLogin: (customerId: string, password: string) =>
    api.post('/auth/customer/login', { customerId, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  requestPasswordReset: (customerId: string, phone?: string) =>
    api.post('/auth/request-reset', { customerId, phone }),
  resetCustomerPassword: (customerId: number, newPassword: string) =>
    api.post('/auth/admin/reset-customer-password', { customerId, newPassword }),
};

// Customer API
export const customerApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/customers', { params }),
  getById: (id: number) => api.get(`/customers/${id}`),
  getSummary: (id: number, params?: { from?: string; to?: string }) =>
    api.get(`/customers/${id}/summary`, { params }),
  getPassbook: (id: number, params?: { from?: string; to?: string }) =>
    api.get(`/customers/${id}/passbook`, { params }),
  create: (data: { amcuCustomerId: string; name: string; phone?: string; address?: string; milkTypeDefault?: string; password?: string }) =>
    api.post('/customers', data),
  update: (id: number, data: Partial<{ name: string; phone: string; address: string; milkTypeDefault: string; password: string; amcuCustomerId: string }>) =>
    api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// Entry API
export const entryApi = {
  getAll: (params?: { from?: string; to?: string; customerId?: number; shift?: string; page?: number; limit?: number }) =>
    api.get('/entries', { params }),
  getCustomerEntries: (customerId: number, params?: { from?: string; to?: string }) =>
    api.get(`/entries/customer/${customerId}`, { params }),
  getToday: (params?: { date?: string }) => api.get('/entries/today', { params }),
  create: (data: { customerId: number; date: string; shift: string; milkType: string; quantityLitre: number; fat?: number; snf?: number; ratePerLitre?: number; amount?: number; notes?: string }) =>
    api.post('/entries', data),
  update: (id: number, data: Partial<{ date: string; shift: string; milkType: string; quantityLitre: number; fat: number; snf: number; notes: string }>) =>
    api.put(`/entries/${id}`, data),
  delete: (id: number) => api.delete(`/entries/${id}`),
  exportCsv: (params?: { from?: string; to?: string; customerId?: number }) =>
    api.get('/entries/export/csv', { params, responseType: 'blob' }),
  exportPdf: (params?: { date?: string }) =>
    api.get('/entries/export/pdf', { params, responseType: 'blob' }),
};

// Payment API
export const paymentApi = {
  getAll: (params?: { from?: string; to?: string; customerId?: number; mode?: string; page?: number; limit?: number }) =>
    api.get('/payments', { params }),
  getCustomerPayments: (customerId: number, params?: { from?: string; to?: string }) =>
    api.get(`/payments/customer/${customerId}`, { params }),
  create: (data: { customerId: number; date: string; amount: number; mode?: string; reference?: string; notes?: string; useAdvance?: boolean }) =>
    api.post('/payments', data),
  update: (id: number, data: Partial<{ date: string; amount: number; mode: string; reference: string; notes: string }>) =>
    api.put(`/payments/${id}`, data),
  delete: (id: number) => api.delete(`/payments/${id}`),
};

// Settings API
export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (data: Record<string, string>) => api.put('/settings', data),
  getRateCards: () => api.get('/settings/rate-cards'),
  createRateCard: (data: { milk_type: string; min_fat?: number; max_fat?: number; min_snf?: number; max_snf?: number; rate_per_litre: number; effective_from?: string }) =>
    api.post('/settings/rate-cards', data),
  updateRateCard: (id: number, data: Partial<{ milk_type: string; min_fat: number; max_fat: number; min_snf: number; max_snf: number; rate_per_litre: number; effective_from: string; is_active: boolean }>) =>
    api.put(`/settings/rate-cards/${id}`, data),
  deleteRateCard: (id: number) => api.delete(`/settings/rate-cards/${id}`),
  getPasswordResetRequests: () => api.get('/settings/password-reset-requests'),
  dismissPasswordResetRequest: (id: number, status = 'completed') => 
    api.put(`/settings/password-reset-requests/${id}`, { status }),
};

export const customerPortalApi = {
  login: (data: { customerIdOrPhone: string; password: string }) => api.post('/customer/auth/login', data),
  getDashboard: (params?: any) => api.get('/customer/me/summary', { params }),
  getTodayCollection: (params?: any) => api.get('/customer/me/today-collection', { params }),
  getLastDaysCollection: (days: number = 10) => api.get('/customer/me/last-days-collection', { params: { days } }),
  getPayments: (params?: any) => api.get('/customer/me/payments', { params }),
  getPassbook: (params: any) => api.get('/customer/me/passbook', { params }),
  getNotifications: (params?: any) => api.get('/customer/me/notifications', { params }),
  getUnreadCount: () => api.get('/customer/me/notifications/unread-count'),
  markNotificationRead: (id: number) => api.put(`/customer/me/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/customer/me/notifications/read-all'),
  getProfile: () => api.get('/customer/me/profile'),
  getNews: () => api.get('/customer/news'),
};

// Advance API
export const advanceApi = {
  getAll: (params?: { customerId?: number; status?: string; page?: number; limit?: number }) =>
    api.get('/advances', { params }),
  create: (data: { customerId: number; amount: number; date?: string; note?: string }) =>
    api.post('/advances', data),
  update: (id: number, data: Partial<{ status: string; utilizedAmount: number; note: string }>) =>
    api.put(`/advances/${id}`, data),
  delete: (id: number) => api.delete(`/advances/${id}`),
  getCustomerBalance: (customerId: number) => api.get(`/advances/customer/${customerId}`),
  getBalance: (customerId: number) => api.get(`/advances/customer/${customerId}`),
};

// AMCU API
export const amcuApi = {
  getStatus: () => api.get('/amcu/status'),
  getLogs: (limit?: number) => api.get('/amcu/logs', { params: { limit } }),
  simulate: (data: { customerId: string; quantityLitre: number; fat?: number; snf?: number; milkType?: string; shift?: string }) =>
    api.post('/amcu/simulate', data),
};

export default api;
