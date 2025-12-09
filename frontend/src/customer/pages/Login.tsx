import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { Milk, ArrowRight, Loader2 } from 'lucide-react';

export default function CustomerLogin() {
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useCustomerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({ customerIdOrPhone: formData.id, password: formData.password });
      navigate('/customer/dashboard');
    } catch (err) {
      setError('Invalid ID or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Milk className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">My Dairy</h1>
          <p className="text-slate-500 mt-1">Farmer Login</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer ID or Phone</label>
            <input
              type="text"
              required
              value={formData.id}
              onChange={e => setFormData({...formData, id: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
              placeholder="Enter ID (e.g. 101)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Login <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-400">
          Trouble logging in? Contact society secretary.
        </p>
      </div>
    </div>
  );
}
