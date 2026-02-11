import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { Milk, Eye, EyeOff, Loader2, UserCircle, KeyRound, ArrowLeft, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { user, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  // Hidden admin access: tap logo 3 times to reveal admin toggle
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showAdminToggle, setShowAdminToggle] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotId, setForgotId] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      setKeyboardVisible(viewportHeight < windowHeight * 0.75);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative"
          style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div className="w-16 h-16 rounded-2xl border-4 border-slate-100 border-t-indigo-500 animate-spin" />
          <Milk className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/' : '/customer/dashboard'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, isAdmin, rememberMe);
      navigate(isAdmin ? '/' : '/customer/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      await authApi.requestPasswordReset(forgotId, forgotPhone || undefined);
      setForgotSuccess(true);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setForgotError(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── Accent colors based on role ──────────────
  const accent = isAdmin
    ? { gradient: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25', ring: 'ring-blue-500/30', border: 'border-blue-500', bg: 'bg-blue-600 hover:bg-blue-700', text: 'text-blue-600', light: 'bg-blue-50 border-blue-100 text-blue-700' }
    : { gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25', ring: 'ring-emerald-500/30', border: 'border-emerald-500', bg: 'bg-emerald-600 hover:bg-emerald-700', text: 'text-emerald-600', light: 'bg-emerald-50 border-emerald-100 text-emerald-700' };

  // ─── Forgot Password View ─────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-start sm:items-center justify-center px-4 py-8 sm:py-4 bg-slate-50 overflow-auto">
        <div className="w-full max-w-sm"
          style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100/80 p-6">
            <button
              onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(''); }}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-5 transition-all group text-[13px] font-medium active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Login
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-3 shadow-lg shadow-amber-500/25">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
              <p className="text-slate-400 mt-1 text-[13px]">Enter your Customer ID to request a reset</p>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-6"
                style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-4 shadow-lg shadow-emerald-500/25">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Request Submitted!</h3>
                <p className="text-slate-400 mb-6 text-[13px]">Contact the dairy admin for your new password.</p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Customer ID (AMCU ID)</label>
                  <input
                    type="text"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-[14px] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                    placeholder="Enter your AMCU ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone (Last 4 digits - optional)</label>
                  <input
                    type="text"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-[14px] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
                    placeholder="For verification"
                    maxLength={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Submit Request
                  {!forgotLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Login View ──────────────────────────
  return (
    <div className={`min-h-screen min-h-[100dvh] flex items-start sm:items-center justify-center px-4 bg-slate-50 overflow-auto ${keyboardVisible ? 'pt-4 pb-8' : 'py-8 sm:py-4'}`}>
      <div className="w-full max-w-sm">
        {/* Logo Section */}
        <div className={`text-center mb-6 transition-all duration-200 ${keyboardVisible ? 'hidden sm:block' : ''}`}
          style={{ animation: 'fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 mx-auto mb-3 shadow-lg shadow-indigo-500/25 cursor-pointer select-none hover:scale-105 active:scale-95 transition-transform"
            onClick={() => {
              if (showAdminToggle) return;
              const newCount = logoClickCount + 1;
              setLogoClickCount(newCount);
              if (newCount >= 3) {
                setShowAdminToggle(true);
              }
              setTimeout(() => setLogoClickCount(0), 2000);
            }}
          >
            <Milk className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Dairy</h1>
          <p className="text-slate-400 mt-1 text-[13px] font-medium">Smart Milk Collection System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100/80 p-6"
          style={{ animation: 'fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '80ms' }}>
          
          {/* Role Selector - Stays visible once activated */}
          {showAdminToggle ? (
            <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl mb-5"
              style={{ animation: 'fadeSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
              <button
                type="button"
                onClick={() => { setIsAdmin(true); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                  isAdmin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => { setIsAdmin(false); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-[13px] font-semibold transition-all ${
                  !isAdmin
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <UserCircle className="w-4 h-4" />
                Customer
              </button>
            </div>
          ) : (
            <div className={`flex items-center justify-center gap-2 mb-5 py-2.5 px-4 rounded-xl border ${accent.light}`}>
              <UserCircle className="w-4 h-4" />
              <span className="text-[13px] font-bold">Farmer Login</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium flex items-center gap-2"
              style={{ animation: 'shake 0.4s ease both' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {isAdmin ? 'Username' : 'Customer ID'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-[14px] placeholder-slate-300 focus:outline-none focus:ring-2 transition-all focus:${accent.ring} focus:${accent.border}`}
                placeholder={isAdmin ? 'Enter admin username' : 'Enter your AMCU ID'}
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-[14px] placeholder-slate-300 focus:outline-none focus:ring-2 transition-all pr-11 focus:${accent.ring} focus:${accent.border}`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors p-1 active:scale-90"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`w-4 h-4 rounded border-slate-300 transition-colors ${
                    isAdmin ? 'text-blue-600 focus:ring-blue-500' : 'text-emerald-600 focus:ring-emerald-500'
                  }`}
                />
              </div>
              <span className="text-[13px] text-slate-400 font-medium group-hover:text-slate-500 transition-colors">Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-white bg-gradient-to-r ${accent.gradient} ${accent.shadow} hover:shadow-lg`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[14px]">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="text-[14px]">Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {!isAdmin && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className={`text-[13px] ${accent.text} font-semibold transition-all hover:opacity-80 active:scale-95`}
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className={`text-center text-slate-300 text-[11px] font-medium mt-6 transition-all ${keyboardVisible ? 'hidden sm:block' : ''}`}>
          © {new Date().getFullYear()} My Dairy • Secure Login
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
