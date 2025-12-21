import { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { I18nProvider, useI18n } from '../context/I18nContext';
import { customerPortalApi } from '../../lib/api';
import { useAndroidBackButton } from '../../hooks/useAndroidBackButton';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import OfflineBanner from '../../components/OfflineBanner';
import { 
  LayoutDashboard, 
  BookOpen, 
  Bell, 
  User,
  LogOut,
  Settings,
  Newspaper,
  Info,
  ChevronRight
} from 'lucide-react';

// Notification Context to share unread count
interface NotificationContextType {
  unreadCount: number;
  refreshCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({ unreadCount: 0, refreshCount: () => {} });
export const useNotifications = () => useContext(NotificationContext);

// Bottom Navigation Component
function BottomNav() {
  const location = useLocation();
  const { t } = useI18n();
  const { unreadCount } = useNotifications();
  
  const navItems = [
    { path: '/customer/dashboard', icon: LayoutDashboard, label: t('nav.home') || 'Home' },
    { path: '/customer/passbook', icon: BookOpen, label: t('nav.passbook') || 'Passbook' },
    { path: '/customer/notifications', icon: Bell, label: t('nav.alerts') || 'Alerts' },
    { path: '/customer/profile', icon: User, label: t('nav.profile') || 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 safe-area-bottom">
      <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/customer/dashboard' && location.pathname === '/customer');
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`tap-scale flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
              }`}>
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                {item.path === '/customer/notifications' && unreadCount > 0 && (
                  unreadCount > 9 
                    ? <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-white">9+</span>
                    : unreadCount > 0
                    ? <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                    : null
                )}
              </div>
              <span className={`text-[9px] font-medium transition-all ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// Profile Menu (Drawer Overlay)
function ProfileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/customer/settings', label: t('settings.title') || 'Settings', icon: Settings },
    { path: '/customer/news', label: t('news.title') || 'News', icon: Newspaper },
    { path: '/customer/about', label: t('about.title') || 'About', icon: Info },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slideUp safe-area-bottom">
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3" />
        
        {/* User Info */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{user?.name}</h3>
              <p className="text-sm text-slate-500">Customer #{user?.amcuId}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onClose(); }}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-700">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
            </button>
          ))}
          
          <div className="h-px bg-slate-100 my-2" />
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium text-red-600">{t('logout') || 'Logout'}</span>
          </button>
        </div>
        
        <div className="h-4" />
      </div>
    </>
  );
}

function CustomerLayoutContent() {
  const { user, isLoading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const { isOffline } = useNetworkStatus();
  
  // Handle Android back button
  useAndroidBackButton();

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const res = await customerPortalApi.getNotifications();
      const notifications = res.data.notifications || [];
      const unread = notifications.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  // Fetch on mount and when route changes to notifications
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Refetch when user navigates away from notifications (they may have read some)
  useEffect(() => {
    if (user && location.pathname !== '/customer/notifications') {
      fetchUnreadCount();
    }
  }, [location.pathname, user]);

  // Close profile menu on route change
  useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not a customer
  if (!user || user.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount: fetchUnreadCount }}>
      <div className="min-h-screen bg-slate-50 flex flex-col safe-area-top">
        {/* Offline Banner */}
        {isOffline && <OfflineBanner isOffline={isOffline} />}
        
        {/* Main Content */}
        <main className="flex-1 pb-16 native-scroll overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-3">
            <Outlet />
          </div>
        </main>

        {/* Fixed Bottom Navigation */}
        <BottomNav />

        {/* Profile Menu Sheet */}
        <ProfileMenu isOpen={showProfileMenu} onClose={() => setShowProfileMenu(false)} />
      </div>
    </NotificationContext.Provider>
  );
}

// Wrap with I18nProvider
export default function CustomerLayout() {
  return (
    <I18nProvider>
      <CustomerLayoutContent />
    </I18nProvider>
  );
}
