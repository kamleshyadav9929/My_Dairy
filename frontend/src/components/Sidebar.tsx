import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Milk, 
  CreditCard, 
  Settings, 
  FileText, 
  Activity, 
  LogOut, 
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, toggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: Milk, label: 'Milk Entries', path: '/entries' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: Activity, label: 'AMCU Status', path: '/amcu' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        w-72
        lg:translate-x-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white/80 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
      `}>
        {/* Logo / Header */}
        <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-8'} transition-all duration-300`}>
          <div className="flex items-center gap-4 group cursor-pointer overflow-hidden">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src="/logo.png" alt="My Dairy" className="relative w-11 h-11 rounded-xl shadow-sm object-cover" />
            </div>
            <div className={`min-w-0 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <h1 className="font-heading font-bold text-slate-900 text-xl leading-tight tracking-tight whitespace-nowrap">My Dairy</h1>
              <p className="text-slate-500 text-xs font-medium tracking-wide whitespace-nowrap">MANAGEMENT</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          {!isCollapsed && (
            <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider animate-in fade-in duration-300">
              Menu
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/50 text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Line */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-600 rounded-r-full" />
                  )}
                  
                  <item.icon className={`w-[22px] h-[22px] shrink-0 transition-colors duration-300 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  
                  <span className={`font-medium tracking-tight text-[15px] flex-1 whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                    {item.label}
                  </span>
                  
                  {isActive && !isCollapsed && (
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Profile / Footer */}
        <div className={`p-4 ${isCollapsed ? 'mx-0 px-2' : 'mx-4'} mb-4 transition-all duration-300`}>
          <div className="glass-card p-1 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                <p className="text-sm font-bold text-slate-900 truncate" title={user?.name || 'Admin'}>
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-slate-500 truncate font-medium">Administrator</p>
              </div>
              {!isCollapsed && (
                <button 
                  onClick={(e) => { e.stopPropagation(); logout(); }}
                  className="p-1.5 shrink-0 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-24 z-50 bg-white border border-slate-200 rounded-full p-1.5 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all duration-300 hover:scale-110"
        >
          {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
