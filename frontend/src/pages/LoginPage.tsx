import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';
import { Milk, Eye, EyeOff, Loader2, ShieldCheck, UserCircle, KeyRound, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { user, login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(true);
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
      // Check if keyboard is likely visible (viewport height decreased significantly)
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
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
          <Milk className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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

    console.log('=== LOGIN ATTEMPT ===');
    console.log('isAdmin:', isAdmin);
    console.log('username:', username);

    try {
      await login(username, password, isAdmin, rememberMe);
      
      console.log('Login successful!');
      console.log('isAdmin state:', isAdmin);
      console.log('Navigating to:', isAdmin ? '/' : '/customer/dashboard');
      
      if (isAdmin) {
        navigate('/', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
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

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-start sm:items-center justify-center px-4 py-8 sm:py-4 bg-slate-50 overflow-auto">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
            <button
              onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(''); }}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-5 transition-colors group text-sm"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Login
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-amber-500 mb-3 shadow-lg shadow-amber-200">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-slate-500 mt-1 text-sm">Enter your Customer ID to request a reset</p>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Request Submitted!</h3>
                <p className="text-slate-500 mb-6 text-sm">Contact the dairy admin for your new password.</p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer ID (AMCU ID)</label>
                  <input
                    type="text"
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    placeholder="Enter your AMCU ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone (Last 4 digits - optional)</label>
                  <input
                    type="text"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    placeholder="For verification"
                    maxLength={4}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
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

  return (
    <div className={`min-h-screen min-h-[100dvh] flex items-start sm:items-center justify-center px-4 bg-slate-50 overflow-auto ${keyboardVisible ? 'pt-4 pb-8' : 'py-8 sm:py-4'}`}>
      <div className="w-full max-w-sm">
        {/* Logo Section - Hide when keyboard is visible on mobile */}
        <div className={`text-center mb-6 transition-all duration-200 ${keyboardVisible ? 'hidden sm:block' : ''}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-3">
            <Milk className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">My Dairy</h1>
          <p className="text-slate-500 mt-1 text-sm">Smart Milk Collection System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          {/* Role Selector */}
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setIsAdmin(true); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                isAdmin
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => { setIsAdmin(false); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                !isAdmin
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCircle className="w-4 h-4" />
              Customer
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {isAdmin ? 'Username' : 'Customer ID'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  isAdmin ? 'focus:ring-blue-500/30 focus:border-blue-500' : 'focus:ring-emerald-500/30 focus:border-emerald-500'
                }`}
                placeholder={isAdmin ? 'Enter admin username' : 'Enter your AMCU ID'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all pr-11 ${
                    isAdmin ? 'focus:ring-blue-500/30 focus:border-blue-500' : 'focus:ring-emerald-500/30 focus:border-emerald-500'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={`w-4 h-4 rounded border-slate-300 transition-colors ${
                  isAdmin ? 'text-blue-600 focus:ring-blue-500' : 'text-emerald-600 focus:ring-emerald-500'
                }`}
              />
              <span className="text-sm text-slate-600">Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 ${
                isAdmin 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {!isAdmin && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className={`text-center text-slate-400 text-xs mt-6 transition-all ${keyboardVisible ? 'hidden sm:block' : ''}`}>
          © {new Date().getFullYear()} My Dairy • Secure Login
        </p>
      </div>
    </div>
  );
}

