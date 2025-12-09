import { useState, useEffect } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../hooks/useI18n';
import { Bell, Loader2, Milk, CreditCard, CheckCheck, RefreshCw } from 'lucide-react';

interface Notification {
  id: number;
  type: 'entry' | 'payment' | 'advance' | 'system';
  title: string;
  message: string;
  amount: number;
  entry_date: string;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      
      const res = await customerPortalApi.getNotifications();
      const data = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await customerPortalApi.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await customerPortalApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-slate-500">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-800">{t('notifications.title')}</h2>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => loadNotifications(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">{t('no.data')}</p>
            <p className="text-slate-400 text-sm mt-1">No recent activity</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              className={`bg-white p-4 rounded-xl border shadow-sm relative pl-14 transition-all cursor-pointer ${
                notif.is_read 
                  ? 'opacity-70 border-slate-100' 
                  : notif.type === 'payment' 
                    ? 'border-emerald-100 hover:border-emerald-200 hover:shadow-md' 
                    : 'border-blue-100 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              {/* Unread indicator */}
              {!notif.is_read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
              
              {/* Icon */}
              <div className={`absolute left-4 top-4 w-8 h-8 rounded-full flex items-center justify-center ${
                notif.type === 'payment' 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {notif.type === 'payment' ? (
                  <CreditCard className="w-4 h-4" />
                ) : (
                  <Milk className="w-4 h-4" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex justify-between items-start mb-1">
                <h3 className={`text-sm font-semibold ${notif.is_read ? 'text-slate-600' : 'text-slate-800'}`}>
                  {notif.title}
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                  {formatDate(notif.entry_date || notif.created_at)}
                </span>
              </div>
              <p className={`text-xs leading-relaxed mb-2 ${notif.is_read ? 'text-slate-500' : 'text-slate-600'}`}>
                {notif.message}
              </p>
              <div className="flex items-center justify-between">
                {notif.amount && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                    notif.type === 'payment' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    ₹{notif.amount.toFixed(2)}
                  </div>
                )}
                {notif.is_read && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
