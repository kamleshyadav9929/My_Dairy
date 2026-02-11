import { useState, useEffect, useCallback } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useNotifications } from '../layouts/CustomerLayout';
import { 
  CreditCard, CheckCheck, Sunrise, Moon, 
  Sparkles, BellOff 
} from 'lucide-react';

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

// ─── Skeleton ────────────────────────────────────────────
function SkeletonItem({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="flex gap-3.5 p-4 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex-shrink-0" />
      <div className="flex-1 space-y-2.5 py-0.5">
        <div className="h-3.5 w-3/5 rounded-md bg-slate-100" />
        <div className="h-3 w-full rounded-md bg-slate-50" />
        <div className="h-3 w-1/4 rounded-md bg-slate-50" />
      </div>
    </div>
  );
}

// ─── Time Formatter ──────────────────────────────────────
function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── Notification type visual config ─────────────────────
function getNotifStyle(notif: Notification) {
  if (notif.type === 'payment') {
    return {
      icon: CreditCard,
      gradient: 'from-emerald-400 to-teal-500',
      softBg: 'bg-emerald-50',
      softText: 'text-emerald-600',
      amountBg: 'bg-emerald-50 text-emerald-700',
      ring: 'ring-emerald-500/20',
    };
  }
  if (notif.title?.toLowerCase().includes('morning')) {
    return {
      icon: Sunrise,
      gradient: 'from-amber-400 to-orange-500',
      softBg: 'bg-amber-50',
      softText: 'text-amber-600',
      amountBg: 'bg-amber-50 text-amber-700',
      ring: 'ring-amber-500/20',
    };
  }
  return {
    icon: Moon,
    gradient: 'from-indigo-400 to-violet-500',
    softBg: 'bg-indigo-50',
    softText: 'text-indigo-600',
    amountBg: 'bg-indigo-50 text-indigo-700',
    ring: 'ring-indigo-500/20',
  };
}

// ─── Single Notification Card ────────────────────────────
function NotificationCard({
  notif,
  index,
  onMarkRead,
}: {
  notif: Notification;
  index: number;
  onMarkRead: (id: number) => void;
}) {
  const isUnread = !notif.is_read;
  const style = getNotifStyle(notif);
  const Icon = style.icon;

  return (
    <div
      onClick={() => isUnread && onMarkRead(notif.id)}
      className={`
        group relative rounded-2xl transition-all duration-300 
        ${isUnread
          ? `bg-white shadow-sm hover:shadow-md cursor-pointer ring-1 ${style.ring}`
          : 'bg-white/60 hover:bg-white/80'
        }
      `}
      style={{ 
        animationDelay: `${index * 50}ms`,
        animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* Unread accent line */}
      {isUnread && (
        <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b ${style.gradient}`} />
      )}

      <div className="flex gap-3.5 p-4">
        {/* Icon */}
        <div className={`
          relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
          transition-transform duration-300 group-hover:scale-105
          ${isUnread
            ? `bg-gradient-to-br ${style.gradient} shadow-lg shadow-${style.gradient.split('-')[1]}-500/25`
            : 'bg-slate-100'
          }
        `}>
          <Icon className={`w-5 h-5 ${isUnread ? 'text-white' : 'text-slate-400'}`} />
          {/* Unread pulse dot */}
          {isUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-white flex items-center justify-center">
              <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${style.gradient} animate-pulse`} />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h4 className={`text-[13px] leading-tight ${
              isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
            }`}>
              {notif.title}
            </h4>
            <span className={`text-[10px] whitespace-nowrap mt-0.5 font-medium ${
              isUnread ? 'text-slate-400' : 'text-slate-300'
            }`}>
              {formatTimeAgo(notif.entry_date || notif.created_at)}
            </span>
          </div>

          <p className={`text-[12.5px] leading-relaxed line-clamp-2 ${
            isUnread ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {notif.message}
          </p>

          {/* Amount badge */}
          {notif.amount > 0 && (
            <div className={`
              inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg text-[11px] font-bold
              ${isUnread ? style.amountBg : 'bg-slate-50 text-slate-500'}
            `}>
              ₹{notif.amount.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function Notifications() {
  const { t } = useI18n();
  const { refreshCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      const res = await customerPortalApi.getNotifications();
      const data = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    // Optimistic update with animation
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    refreshCount();
    try {
      await customerPortalApi.markNotificationRead(id);
    } catch {
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: false } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const hadUnread = notifications.some(n => !n.is_read);
    if (!hadUnread) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    refreshCount();
    try {
      await customerPortalApi.markAllNotificationsRead();
    } catch {
      loadNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // ─── Loading ─────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="h-7 w-32 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-8 w-24 rounded-xl bg-slate-100 animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-slate-50">
          {[0, 1, 2, 3].map(i => <SkeletonItem key={i} delay={i * 80} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {t('alerts.title')}
          </h2>
          {unreadCount > 0 && (
            <span className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-30" />
              <span className="relative inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-indigo-500/30">
                {unreadCount}
              </span>
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 px-3 py-2 rounded-xl transition-all duration-200"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t('mark.all.read')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {/* ─── Empty State ──────────────────────────── */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center pt-16 pb-20">
          {/* Decorative rings */}
          <div className="relative mb-6">
            <div className="absolute inset-0 -m-4 rounded-full bg-slate-100/50 animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 -m-8 rounded-full bg-slate-50/50" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              <BellOff className="w-9 h-9 text-slate-300" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">{t('all.caught.up')}</h3>
          <p className="text-sm text-slate-400 text-center max-w-[200px] leading-relaxed">
            {t('no.notifications')}
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-slate-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">You're all set</span>
          </div>
        </div>
      ) : (
        /* ─── Notification List ─────────────────── */
        <div className="space-y-2">
          {/* Today's date label if any notifications exist */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-1 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                New
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
          )}

          {/* Unread first, then read */}
          {notifications
            .sort((a, b) => {
              if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .map((notif, idx) => {
              // Insert "Earlier" divider between unread and read
              const isFirstRead = notif.is_read && idx > 0 && !notifications
                .sort((a, b) => {
                  if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })[idx - 1]?.is_read;

              return (
                <div key={notif.id}>
                  {isFirstRead && (
                    <div className="flex items-center gap-2 px-1 mt-4 mb-2">
                      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                        Earlier
                      </span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                  )}
                  <NotificationCard
                    notif={notif}
                    index={idx}
                    onMarkRead={handleMarkAsRead}
                  />
                </div>
              );
            })}
        </div>
      )}

      {/* Inline keyframe for card entrance */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
