import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerApi, authApi } from '../lib/api';
import { Milk, CreditCard, TrendingUp, Wallet, Share2, LogOut, RefreshCw, User, KeyRound, Eye, EyeOff, Loader2, CheckCircle, X } from 'lucide-react';

interface Summary {
  totalLitres: number;
  totalAmount: number;
  totalPayments: number;
  balance: number;
  entryCount: number;
}

interface ThisMonth {
  totalLitres: number;
  totalAmount: number;
}

interface PassbookEntry {
  id: number;
  type: 'entry' | 'payment';
  date: string;
  time?: string;
  shift?: string;
  milk_type?: string;
  quantity_litre?: number;
  amount: number;
  mode?: string;
  runningBalance: number;
}

export default function CustomerPortalPage() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [thisMonth, setThisMonth] = useState<ThisMonth | null>(null);
  const [passbook, setPassbook] = useState<PassbookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Change Password State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.customerId) {
      loadData();

      // Poll every 15s (silent/refresh mode)
      const interval = setInterval(() => loadData(true), 15000);

      const handleFocus = () => loadData(true);
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user]);

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      
      const [summaryRes, passbookRes] = await Promise.all([
        customerApi.getSummary(user!.customerId!),
        customerApi.getPassbook(user!.customerId!)
      ]);
      setSummary(summaryRes.data.summary);
      setThisMonth(summaryRes.data.thisMonth);
      setPassbook(passbookRes.data.passbook || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const handleShare = () => {
    const message = `🥛 *My Dairy Passbook*\n\n👤 Customer: ${user?.name}\n📋 ID: #${user?.amcuId}\n\n📊 *This Month*\n🥛 Milk: ${thisMonth?.totalLitres?.toFixed(1) || 0}L\n💰 Amount: ${formatCurrency(thisMonth?.totalAmount || 0)}\n\n📈 *Overall*\n🥛 Total Milk: ${summary?.totalLitres?.toFixed(1) || 0}L\n💰 Total Amount: ${formatCurrency(summary?.totalAmount || 0)}\n✅ Paid: ${formatCurrency(summary?.totalPayments || 0)}\n💳 Balance: ${formatCurrency(summary?.balance || 0)}`;
    
    if (navigator.share) {
      navigator.share({ title: 'My Dairy Passbook', text: message });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordSuccess(false);
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center animate-pulse">
            <Milk className="w-8 h-8 text-white" />
          </div>
          <div className="spinner mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading your passbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Change Password
              </h3>
              <button onClick={resetPasswordModal} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Password Changed!</h4>
                <p className="text-slate-400 mb-6">Your password has been updated successfully.</p>
                <button
                  onClick={resetPasswordModal}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pr-12"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Default is 1234 if not changed before</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all pr-12"
                      placeholder="Enter new password"
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetPasswordModal}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-slate-400 text-sm sm:text-base">ID: #{user?.amcuId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
              title="Change Password"
            >
              <KeyRound className="w-5 h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={logout}
              className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </header>

        {/* Balance Card - Hero */}
        <div className="mb-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative">
            <p className="text-blue-100 text-sm sm:text-base mb-2">Current Balance</p>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
              {formatCurrency(summary?.balance || 0)}
            </p>
            <p className="text-blue-200 text-sm">
              {(summary?.balance || 0) > 0 ? 'Amount due to dairy' : 'All cleared! 🎉'}
            </p>
          </div>
        </div>

        {/* This Month Stats */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 px-1">This Month</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Milk className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{thisMonth?.totalLitres?.toFixed(1) || 0}<span className="text-lg text-slate-400">L</span></p>
              <p className="text-slate-400 text-sm mt-1">Milk Supplied</p>
            </div>
            
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{formatCurrency(thisMonth?.totalAmount || 0)}</p>
              <p className="text-slate-400 text-sm mt-1">Earned</p>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 px-1">Overall Summary</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
              <p className="text-lg sm:text-xl font-bold text-white">{summary?.totalLitres?.toFixed(0) || 0}L</p>
              <p className="text-slate-500 text-xs sm:text-sm">Total Milk</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
              <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(summary?.totalPayments || 0)}</p>
              <p className="text-slate-500 text-xs sm:text-sm">Received</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 text-center">
              <p className="text-lg sm:text-xl font-bold text-white">{summary?.entryCount || 0}</p>
              <p className="text-slate-500 text-xs sm:text-sm">Entries</p>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="w-full mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 text-white font-medium"
        >
          <Share2 className="w-5 h-5" />
          Share via WhatsApp
        </button>

        {/* Passbook */}
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Transaction History</h2>
            <p className="text-slate-400 text-sm">Your milk entries and payments</p>
          </div>
          
          {passbook.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400">No transactions yet</p>
              <p className="text-slate-500 text-sm mt-1">Your milk entries will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {passbook.slice(-100).reverse().map((entry) => (
                <div key={`${entry.type}-${entry.id}`} className="p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                        entry.type === 'entry' 
                          ? 'bg-blue-500/20' 
                          : 'bg-emerald-500/20'
                      }`}>
                        {entry.type === 'entry' ? (
                          <Milk className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        ) : (
                          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm sm:text-base">
                          {entry.type === 'entry' 
                            ? `${entry.quantity_litre}L ${entry.milk_type}`
                            : `Payment${entry.mode ? ` (${entry.mode})` : ''}`
                          }
                        </p>
                        <p className="text-slate-500 text-xs sm:text-sm">
                          {formatDate(entry.date)}
                          {entry.shift && <span className="ml-2 text-slate-600">• {entry.shift === 'M' ? 'Morning' : 'Evening'}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm sm:text-base ${
                        entry.type === 'entry' ? 'text-blue-400' : 'text-emerald-400'
                      }`}>
                        {entry.type === 'entry' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Bal: {formatCurrency(entry.runningBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-slate-600 text-sm">
          <p>My Dairy • Milk Collection System</p>
        </footer>
      </div>
    </div>
  );
}
