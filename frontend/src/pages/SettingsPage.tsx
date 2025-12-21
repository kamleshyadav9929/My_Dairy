import { useState, useEffect } from 'react';
import { settingsApi, authApi, customerApi } from '../lib/api';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { SkeletonForm } from '../components/ui/Skeleton';
import { 
  Save, 
  Trash2, 
  Loader2, 
  Settings, 
  DollarSign, 
  Store, 
  MapPin, 
  User,
  Plus,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';

interface RateCard {
  id: number;
  milk_type: string;
  min_fat: number | null;
  max_fat: number | null;
  min_snf: number | null;
  max_snf: number | null;
  rate_per_litre: number;
  effective_from: string | null;
  is_active: number;
}

interface PasswordResetRequest {
  id: number;
  customer_id: number;
  customer_name: string;
  amcu_customer_id: string;
  status: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  amcu_customer_id: string;
}

export default function SettingsPage() {
  const confirmDialog = useConfirm();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password reset requests
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);

  // Reset customer password
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      loadSecurityData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsRes, rateRes] = await Promise.all([
        settingsApi.getAll(),
        settingsApi.getRateCards()
      ]);
      setSettings(settingsRes.data.settings || {});
      setRateCards(rateRes.data.rateCards || []);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityData = async () => {
    try {
      const [requestsRes, customersRes] = await Promise.all([
        settingsApi.getPasswordResetRequests(),
        customerApi.getAll({ limit: 500 })
      ]);
      setResetRequests(requestsRes.data.requests || []);
      setCustomers(customersRes.data.customers || []);
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await settingsApi.update(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRateCard = async (id: number) => {
    const confirmed = await confirmDialog({
      title: 'Delete Rate Card?',
      message: 'This will permanently delete this rate card configuration.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (!confirmed) return;
    try {
      await settingsApi.deleteRateCard(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete rate card:', error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

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

  const handleResetCustomerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!selectedCustomer || !resetPassword) {
      setResetError('Select customer and enter new password');
      return;
    }

    setResetLoading(true);

    try {
      const res = await authApi.resetCustomerPassword(parseInt(selectedCustomer), resetPassword);
      setResetSuccess(res.data.message || 'Password reset successfully');
      setSelectedCustomer('');
      setResetPassword('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setResetError(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDismissRequest = async (id: number) => {
    try {
      await settingsApi.dismissPasswordResetRequest(id);
      setResetRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to dismiss request:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <div className="skeleton h-8 w-32 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton h-12 w-64 rounded-2xl" />
        <div className="glass-card p-6">
          <SkeletonForm />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Settings
          </h1>
          <p className="text-slate-500 mt-1">Configure your dairy business preferences</p>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex p-1 bg-white backdrop-blur-md rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === 'general' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          General
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === 'rates' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Rate Cards
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative ${
            activeTab === 'security' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
          {resetRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {resetRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Business Info Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Store className="w-5 h-5" />
              </div>
              Business Information
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dairy Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.dairy_name || ''}
                    onChange={(e) => setSettings({ ...settings, dairy_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-11"
                    placeholder="Enter dairy name"
                  />
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.owner_name || ''}
                    onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-11"
                    placeholder="Enter owner name"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pl-11"
                    placeholder="Enter address"
                  />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving} 
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/25 font-bold"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Business Info
                </button>
            </div>
          </div>


        </div>
      )}

      {activeTab === 'rates' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Rate Cards</h2>
              <p className="text-sm text-slate-500 mt-1">Configure advanced rates based on Fat/SNF content</p>
            </div>
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg text-sm border border-slate-200 transition-colors">
               <Plus className="w-4 h-4" /> Add Rate Card
             </button>
          </div>

          {rateCards.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No rate cards found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                No specific rate cards are configured. The system will use the default base rates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                    <th className="px-6 py-4">Milk Type</th>
                    <th className="px-6 py-4">Fat Range</th>
                    <th className="px-6 py-4">SNF Range</th>
                    <th className="px-6 py-4">Rate (₹/L)</th>
                    <th className="px-6 py-4">Effective Date</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {rateCards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-100/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          card.milk_type === 'COW' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : card.milk_type === 'BUFFALO'
                            ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {card.milk_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-sm">
                        {card.min_fat ?? '0'} - {card.max_fat ?? '∞'}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-sm">
                        {card.min_snf ?? '0'} - {card.max_snf ?? '∞'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-emerald-400 font-bold">₹{card.rate_per_litre}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {card.effective_from ? new Date(card.effective_from).toLocaleDateString() : 'Always'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteRateCard(card.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Admin Password Change */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              Change Admin Password
            </h2>

            {passwordSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Password Changed!</h4>
                <button
                  onClick={() => setPasswordSuccess(false)}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 pr-12"
                      required
                      minLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Update Password
                </button>
              </form>
            )}
          </div>

          {/* Reset Customer Password */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <RefreshCw className="w-5 h-5" />
              </div>
              Reset Customer Password
            </h2>

            <form onSubmit={handleResetCustomerPassword} className="space-y-4">
              {resetError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {resetSuccess}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Select Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  <option value="">Choose a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (#{c.amcu_customer_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">New Password</label>
                <input
                  type="text"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter new password for customer"
                  required
                  minLength={4}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Reset Password
              </button>
            </form>
          </div>

          {/* Password Reset Requests */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                Password Reset Requests
                {resetRequests.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                    {resetRequests.length} pending
                  </span>
                )}
              </h2>
              <button
                onClick={loadSecurityData}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {resetRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">No pending password reset requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resetRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{request.customer_name}</p>
                        <p className="text-sm text-slate-500">ID: #{request.amcu_customer_id} • {formatDate(request.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(String(request.customer_id));
                          handleDismissRequest(request.id);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDismissRequest(request.id)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

