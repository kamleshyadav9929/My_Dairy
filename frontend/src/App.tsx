import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import EntriesPage from './pages/EntriesPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import AmcuPage from './pages/AmcuPage';
import ReportsPage from './pages/ReportsPage';

import CustomerLayout from './customer/layouts/CustomerLayout';
import CustomerDashboard from './customer/pages/Dashboard';
import Passbook from './customer/pages/Passbook';
import Notifications from './customer/pages/Notifications';
import Settings from './customer/pages/Settings';
import Profile, { News, About, LatestPayments } from './customer/pages/Profile';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'admin' | 'customer' }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/' : '/customer/dashboard'} replace />;
  }

  return <>{children}</>;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`
        flex flex-col min-h-screen transition-all duration-300 ease-in-out bg-slate-50
        ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-slate-900">My Dairy</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route path="/" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><DashboardPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><CustomersPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/entries" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><EntriesPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/payments" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><PaymentsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><SettingsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/amcu" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><AmcuPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout><ReportsPage /></AdminLayout>
        </ProtectedRoute>
      } />

      {/* Customer Routes - unified auth */}
      <Route path="/customer/login" element={<Navigate to="/login" replace />} />
      <Route path="/customer" element={<CustomerLayout />}>
         <Route index element={<Navigate to="dashboard" replace />} />
         <Route path="dashboard" element={<CustomerDashboard />} />
         <Route path="passbook" element={<Passbook />} />
         <Route path="notifications" element={<Notifications />} />
         <Route path="settings" element={<Settings />} />
         <Route path="profile" element={<Profile />} />
         <Route path="news" element={<News />} />
         <Route path="about" element={<About />} />
         <Route path="latest-payments" element={<LatestPayments />} />
      </Route>

      {/* Customer Portal (Legacy Redirect) */}
      <Route path="/portal" element={<Navigate to="/customer/dashboard" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
