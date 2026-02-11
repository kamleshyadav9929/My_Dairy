import { useState, useEffect, useCallback } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useNotifications } from '../layouts/CustomerLayout';
import { Bell, CreditCard, CheckCheck, Sunrise, Moon, Loader2 } from 'lucide-react';

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

// Skeleton Component
function SkeletonNotification() {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100">
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="skeleton h-4 w-32 mb-2" />
          <div className="skeleton h-3 w-full mb-2" />
          <div className="skeleton h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function Notifications() {
  const { t } = useI18n();
  const { refreshCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await customerPortalApi.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      refreshCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await customerPortalApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (notif: Notification) => {
    if (notif.type === 'payment') {
      return { icon: CreditCard, bg: 'bg-emerald-50', color: 'text-emerald-600' };
    }
    const isMorning = notif.title?.toLowerCase().includes('morning');
    if (isMorning) {
      return { icon: Sunrise, bg: 'bg-amber-50', color: 'text-amber-500' };
    }
    return { icon: Moon, bg: 'bg-indigo-50', color: 'text-indigo-500' };
  };

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{t('alerts.title')}</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <SkeletonNotification key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header — matches mobile: title + unread count badge + mark all read */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">{t('alerts.title')}</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors tap-scale"
          >
            <CheckCheck className="w-4 h-4" />
            {t('mark.all.read')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Empty State — matches mobile */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">{t('all.caught.up')}</h3>
          <p className="text-sm text-slate-400">{t('no.notifications')}</p>
        </div>
      ) : (
        /* Flat list — matches mobile's simple scrollable list */
        <div className="space-y-2">
          {notifications.map((notif) => {
            const { icon: Icon, bg, color } = getNotificationIcon(notif);
            const isUnread = !notif.is_read;

            return (
              <div
                key={notif.id}
                onClick={() => isUnread && handleMarkAsRead(notif.id)}
                className={`bg-white p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'border-l-4 border-l-indigo-500 border-slate-100 shadow-sm cursor-pointer hover:shadow-md'
                    : 'border-slate-100 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isUnread ? `${bg} ${color}` : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm ${isUnread ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                        {!isUnread && <CheckCheck className="w-3 h-3" />}
                        {formatTimeAgo(notif.entry_date || notif.created_at)}
                      </span>
                    </div>
                    <p className={`text-sm mt-0.5 leading-relaxed ${isUnread ? 'text-slate-600' : 'text-slate-500'}`}>
                      {notif.message}
                    </p>
                    {notif.amount > 0 && (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded mt-2 text-xs font-bold ${
                        isUnread
                          ? notif.type === 'payment'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        ₹{notif.amount.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
