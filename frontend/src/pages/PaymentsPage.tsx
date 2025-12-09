import { useState, useEffect } from 'react';
import { paymentApi, customerApi, advanceApi } from '../lib/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  CreditCard,
  Calendar,
  MoreVertical,
  Wallet,
  Search,
  ChevronDown,
  Banknote,
  ArrowUpCircle,
  User
} from 'lucide-react';

interface Payment {
  id: number;
  customer_id: number;
  customer_name: string;
  amcu_customer_id: string;
  date: string;
  amount: number;
  mode: string;
  reference: string | null;
  notes: string | null;
}

interface Advance {
  id: number;
  customer_id: number;
  amount: number;
  date: string;
  note: string | null;
  status: string;
  utilized_amount: number;
  customers?: { name: string; amcu_customer_id: string };
}

interface Customer {
  id: number;
  amcu_customer_id: string;
  name: string;
}

export default function PaymentsPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'payments' | 'advances'>('payments');
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    mode: 'CASH',
    reference: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [useAdvance, setUseAdvance] = useState(false);
  const [customerAdvanceBalance, setCustomerAdvanceBalance] = useState(0);
  const [loadingAdvanceBalance, setLoadingAdvanceBalance] = useState(false);

  // Advances state
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoadingAdvances, setIsLoadingAdvances] = useState(true);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [advanceFormData, setAdvanceFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: ''
  });
  const [isSavingAdvance, setIsSavingAdvance] = useState(false);
  const [advanceMenu, setAdvanceMenu] = useState<number | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadPayments();
    } else {
      loadAdvances();
    }
  }, [dateFrom, dateTo, selectedCustomer, activeTab]);

  const loadCustomers = async () => {
    try {
      const res = await customerApi.getAll({ limit: 500 });
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const res = await paymentApi.getAll({
        from: dateFrom,
        to: dateTo,
        customerId: selectedCustomer ? parseInt(selectedCustomer) : undefined,
        limit: 200
      });
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdvances = async () => {
    try {
      setIsLoadingAdvances(true);
      const res = await advanceApi.getAll({
        customerId: selectedCustomer ? parseInt(selectedCustomer) : undefined,
        limit: 200
      });
      setAdvances(res.data.advances || []);
    } catch (error) {
      console.error('Failed to load advances:', error);
    } finally {
      setIsLoadingAdvances(false);
    }
  };

  // Fetch customer advance balance when customer is selected in payment modal
  const fetchCustomerAdvanceBalance = async (customerId: string) => {
    if (!customerId) {
      setCustomerAdvanceBalance(0);
      return;
    }
    setLoadingAdvanceBalance(true);
    try {
      const res = await advanceApi.getBalance(parseInt(customerId));
      setCustomerAdvanceBalance(res.data.balance || 0);
    } catch (error) {
      console.error('Failed to fetch advance balance:', error);
      setCustomerAdvanceBalance(0);
    } finally {
      setLoadingAdvanceBalance(false);
    }
  };

  // Payment handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = {
        customerId: parseInt(formData.customerId),
        date: formData.date,
        amount: parseFloat(formData.amount),
        mode: formData.mode,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined
      };

      if (editingPayment) {
        await paymentApi.update(editingPayment.id, data);
      } else {
        await paymentApi.create({ ...data, useAdvance });
      }
      setShowModal(false);
      resetForm();
      loadPayments();
      if (activeTab === 'advances') loadAdvances(); // Refresh advances if using advance
    } catch (error) {
      console.error('Failed to save payment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      customerId: payment.customer_id.toString(),
      date: payment.date,
      amount: payment.amount.toString(),
      mode: payment.mode,
      reference: payment.reference || '',
      notes: payment.notes || ''
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await paymentApi.delete(id);
      loadPayments();
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
    setActiveMenu(null);
  };

  const resetForm = () => {
    setEditingPayment(null);
    setFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      mode: 'CASH',
      reference: '',
      notes: ''
    });
    setUseAdvance(false);
    setCustomerAdvanceBalance(0);
  };

  // Advance handlers
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdvance(true);

    try {
      const data = {
        customerId: parseInt(advanceFormData.customerId),
        date: advanceFormData.date,
        amount: parseFloat(advanceFormData.amount),
        note: advanceFormData.note || undefined
      };

      if (editingAdvance) {
        await advanceApi.update(editingAdvance.id, data);
      } else {
        await advanceApi.create(data);
      }
      setShowAdvanceModal(false);
      resetAdvanceForm();
      loadAdvances();
    } catch (error) {
      console.error('Failed to save advance:', error);
      alert('Failed to save advance. Make sure the advances table exists in Supabase.');
    } finally {
      setIsSavingAdvance(false);
    }
  };

  const handleEditAdvance = (advance: Advance) => {
    setEditingAdvance(advance);
    setAdvanceFormData({
      customerId: advance.customer_id.toString(),
      date: advance.date,
      amount: advance.amount.toString(),
      note: advance.note || ''
    });
    setShowAdvanceModal(true);
    setAdvanceMenu(null);
  };

  const handleDeleteAdvance = async (id: number) => {
    if (!confirm('Are you sure you want to delete this advance?')) return;
    try {
      await advanceApi.delete(id);
      loadAdvances();
    } catch (error) {
      console.error('Failed to delete advance:', error);
    }
    setAdvanceMenu(null);
  };

  const resetAdvanceForm = () => {
    setEditingAdvance(null);
    setAdvanceFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      note: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalAdvances = advances.reduce((sum, a) => sum + (a.amount - a.utilized_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments & Advances</h1>
            <p className="text-gray-500 text-sm mt-1">Manage payments and customer advances.</p>
          </div>
          <button
            onClick={() => activeTab === 'payments' ? (resetForm(), setShowModal(true)) : (resetAdvanceForm(), setShowAdvanceModal(true))}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'payments' ? 'Record Payment' : 'Record Advance'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white rounded-xl w-fit border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'payments' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Payments
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'advances' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Advances
          </button>
        </div>

        {/* Filters & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Filters */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {activeTab === 'payments' && (
                <div className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 p-0 w-28"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 p-0 w-28"
                  />
                </div>
              )}
              <div className="relative w-full sm:flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none"
                >
                  <option value="">All Customers</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (#{c.amcu_customer_id})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className={`rounded-xl p-4 text-white shadow-md flex flex-col justify-between relative overflow-hidden ${
            activeTab === 'payments' 
              ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' 
              : 'bg-gradient-to-br from-purple-600 to-purple-700'
          }`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-white/80">
                {activeTab === 'payments' ? <Wallet className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {activeTab === 'payments' ? 'Total Payments' : 'Active Advances'}
                </span>
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {formatCurrency(activeTab === 'payments' ? totalPayments : totalAdvances)}
              </div>
              <div className="mt-2 text-xs text-white/70 font-medium">
                {activeTab === 'payments' ? payments.length : advances.length} records found
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'payments' ? (
          // Payments Table
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No payments found</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                  Adjust your filters or record a new payment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Reference</th>
                      <th className="px-6 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{payment.customer_name}</p>
                              <p className="text-xs text-gray-500">#{payment.amcu_customer_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            payment.mode === 'CASH' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : payment.mode === 'UPI'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {payment.mode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          {payment.reference || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button 
                              onClick={() => setActiveMenu(activeMenu === payment.id ? null : payment.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {activeMenu === payment.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1">
                                  <button 
                                    onClick={() => handleEdit(payment)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4 text-gray-400" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(payment.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Advances Table
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {isLoadingAdvances ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading advances...</p>
              </div>
            ) : advances.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <ArrowUpCircle className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No advances found</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                  Record advance payments from customers here.
                </p>
                <button
                  onClick={() => { resetAdvanceForm(); setShowAdvanceModal(true); }}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                >
                  Record First Advance
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Used</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Note</th>
                      <th className="px-6 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {advances.map((advance) => (
                      <tr key={advance.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(advance.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{advance.customers?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">#{advance.customers?.amcu_customer_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(advance.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">{formatCurrency(advance.utilized_amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-purple-600">
                            {formatCurrency(advance.amount - advance.utilized_amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            advance.status === 'active' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : advance.status === 'utilized'
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {advance.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate">
                          {advance.note || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button 
                              onClick={() => setAdvanceMenu(advanceMenu === advance.id ? null : advance.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {advanceMenu === advance.id && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setAdvanceMenu(null)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1">
                                  <button 
                                    onClick={() => handleEditAdvance(advance)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4 text-gray-400" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteAdvance(advance.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl sm:w-full sm:max-w-lg border border-gray-100">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingPayment ? 'Edit Payment' : 'New Payment'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => {
                        setFormData({ ...formData, customerId: e.target.value });
                        fetchCustomerAdvanceBalance(e.target.value);
                        setUseAdvance(false);
                      }}
                      className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-gray-900 text-sm"
                      required
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} (#{c.amcu_customer_id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Advance Balance Display */}
                  {formData.customerId && !editingPayment && (
                    <div className={`p-3 rounded-lg border ${customerAdvanceBalance > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className={`w-4 h-4 ${customerAdvanceBalance > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-600">Advance Balance:</span>
                        </div>
                        {loadingAdvanceBalance ? (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        ) : (
                          <span className={`font-bold ${customerAdvanceBalance > 0 ? 'text-purple-700' : 'text-gray-500'}`}>
                            {formatCurrency(customerAdvanceBalance)}
                          </span>
                        )}
                      </div>
                      
                      {customerAdvanceBalance > 0 && (
                        <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={useAdvance}
                              onChange={(e) => setUseAdvance(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-10 h-5 rounded-full transition-all ${
                              useAdvance ? 'bg-purple-600' : 'bg-gray-300'
                            }`}></div>
                            <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                              useAdvance ? 'translate-x-5' : 'translate-x-0'
                            }`}></div>
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-gray-900">
                            Deduct from advance
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 pl-7 pr-3 text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                      <select
                        value={formData.mode}
                        onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                        className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-sm"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK">Bank</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-sm"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingPayment ? 'Save' : 'Confirm'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowAdvanceModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl sm:w-full sm:max-w-lg border border-gray-100">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingAdvance ? 'Edit Advance' : 'New Advance Payment'}
                  </h3>
                  <button onClick={() => setShowAdvanceModal(false)} className="p-1 text-gray-400 hover:text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAdvanceSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                    <select
                      value={advanceFormData.customerId}
                      onChange={(e) => setAdvanceFormData({ ...advanceFormData, customerId: e.target.value })}
                      className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-gray-900 text-sm"
                      required
                    >
                      <option value="">Select customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} (#{c.amcu_customer_id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        value={advanceFormData.date}
                        onChange={(e) => setAdvanceFormData({ ...advanceFormData, date: e.target.value })}
                        className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={advanceFormData.amount}
                          onChange={(e) => setAdvanceFormData({ ...advanceFormData, amount: e.target.value })}
                          className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 pl-7 pr-3 text-sm"
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <textarea
                      value={advanceFormData.note}
                      onChange={(e) => setAdvanceFormData({ ...advanceFormData, note: e.target.value })}
                      className="w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 px-3 text-sm resize-none h-20"
                      placeholder="Optional note..."
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowAdvanceModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSavingAdvance} className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      {isSavingAdvance && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingAdvance ? 'Save' : 'Record Advance'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}