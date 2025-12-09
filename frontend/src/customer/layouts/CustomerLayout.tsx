import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { I18nProvider, useI18n } from '../context/I18nContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  IndianRupee, 
  Bell, 
  Newspaper, 
  Settings, 
  User, 
  Info, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';

function CustomerLayoutContent() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not a customer
  if (!user || user.role !== 'customer') {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    { path: '/customer/dashboard', label: t('dashboard.title'), icon: LayoutDashboard },
    { path: '/customer/passbook', label: t('passbook.title'), icon: BookOpen },
    { path: '/customer/latest-payments', label: t('payments.title'), icon: IndianRupee },
    { path: '/customer/notifications', label: t('notifications.title'), icon: Bell },
    { path: '/customer/news', label: t('news.title'), icon: Newspaper },
    { path: '/customer/settings', label: t('settings.title'), icon: Settings },
    { path: '/customer/profile', label: t('profile.title'), icon: User },
    { path: '/customer/about', label: t('about.title'), icon: Info },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-40 flex items-center justify-between px-4 shadow-sm border-b border-slate-100 transition-all duration-300">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-50 text-slate-700 transition active:scale-95"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
             <h1 className="text-lg font-bold text-slate-800 leading-none">My Dairy</h1>
             {user && <p className="text-[10px] font-medium text-slate-500 tracking-wide uppercase">ID: {user.amcuId}</p>}
          </div>
        </div>
        
        {/* Profile/Notifs Quick Actions */}
        <div className="flex items-center gap-2">
            <NavLink to="/customer/notifications" className="p-2 rounded-full hover:bg-slate-50 text-slate-600 relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </NavLink>
        </div>
      </header>

      {/* Sidebar Drawer */}
      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Drawer */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative h-40 bg-gradient-to-br from-indigo-600 to-blue-700 p-6 flex flex-col justify-end text-white">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-white/80 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold shadow-lg border-2 border-white/20">
              {user?.name?.[0]}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">{user?.name}</h2>
              <p className="text-blue-100 text-sm opacity-90">Customer</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-10rem)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm translate-x-1' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          
          <div className="my-4 border-t border-dashed border-slate-200" />

          <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
            </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="pt-20 min-h-screen px-4 pb-10">
        <Outlet />
      </main>
    </div>
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
