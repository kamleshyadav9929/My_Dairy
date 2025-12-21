import { useState, useEffect } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useNotifications } from '../layouts/CustomerLayout';
import { Bell, CreditCard, CheckCheck, Sunrise, Moon } from 'lucide-react';

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
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
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
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await customerPortalApi.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      refreshCount(); // Update the badge count in bottom nav
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await customerPortalApi.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refreshCount(); // Update the badge count in bottom nav
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

  // Group notifications
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const key = notif.is_read ? 'read' : 'unread';
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  const getNotificationIcon = (notif: Notification) => {
    if (notif.type === 'payment') {
      return { icon: CreditCard, bg: 'bg-emerald-100', color: 'text-emerald-600' };
    }
    // For milk entries, try to determine shift from title
    const isMorning = notif.title?.toLowerCase().includes('morning');
    if (isMorning) {
      return { icon: Sunrise, bg: 'bg-amber-100', color: 'text-amber-600' };
    }
    return { icon: Moon, bg: 'bg-indigo-100', color: 'text-indigo-600' };
  };

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{t('notifications.title')}</h2>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">{t('notifications.title')}</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">No notifications</h3>
          <p className="text-sm text-slate-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Unread Section */}
          {groupedNotifications.unread && groupedNotifications.unread.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1">New</p>
              {groupedNotifications.unread.map((notif) => {
                const { icon: Icon, bg, color } = getNotificationIcon(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="bg-white p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${color} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-800 text-sm">{notif.title}</h3>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatTimeAgo(notif.entry_date || notif.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                        {notif.amount > 0 && (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded mt-2 text-xs font-bold ${
                            notif.type === 'payment' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-indigo-50 text-indigo-700'
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

          {/* Read Section */}
          {groupedNotifications.read && groupedNotifications.read.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">Earlier</p>
              {groupedNotifications.read.map((notif) => {
                const { icon: Icon } = getNotificationIcon(notif);
                return (
                  <div
                    key={notif.id}
                    className="bg-white p-4 rounded-xl border border-slate-100 opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-slate-600 text-sm">{notif.title}</h3>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            {formatTimeAgo(notif.entry_date || notif.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                        {notif.amount > 0 && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded mt-2 text-xs font-medium bg-slate-100 text-slate-600">
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
      )}
    </div>
  );
}
