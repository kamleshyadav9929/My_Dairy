import { useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { customerApi } from '../lib/api';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  Users,
  User,
  Phone,
  MapPin,
  MoreVertical,
  MessageCircle
} from 'lucide-react';

interface Customer {
  id: number;
  amcu_customer_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  milk_type_default: string;
  balance: number;
  total_milk_amount: number;
  total_payments: number;
}

interface CustomerFormData {
  amcuCustomerId: string;
  name: string;
  phone: string;
  address: string;
  milkTypeDefault: string;
  password: string;
}

// Portal Component for Action Menu
const ActionMenu = ({ 
  onEdit, 
  onDelete,
  onWhatsApp,
  onClose,
  anchorEl 
}: { 
  onEdit: () => void, 
  onDelete: () => void,
  onWhatsApp: () => void,
  onClose: () => void,
  anchorEl: HTMLElement | null
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const menuWidth = 192; // w-48
  const menuHeight = 140;

  useLayoutEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = rect.right - menuWidth;
      if (left < 10) left = 10;
      if (left + menuWidth > viewportWidth - 10) left = viewportWidth - menuWidth - 10;
      
      let top = rect.bottom + 5;
      // Flip to top if not enough space below
      if (top + menuHeight > viewportHeight - 10 && rect.top > menuHeight + 10) {
        top = rect.top - menuHeight - 5;
      }
      
      setCoords({ top, left });
    }
  }, [anchorEl]);

  if (!anchorEl || !coords) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose}></div>
      <div 
        className="fixed z-[101] w-48 bg-white border border-slate-200 rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{ top: coords.top, left: coords.left }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onWhatsApp(); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" /> Share via WhatsApp
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" /> Edit Details
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
        >
          <Trash2 className="w-4 h-4" /> Delete Customer
        </button>
      </div>
    </>,
    document.body
  );
};

export default function CustomersPage() {
  const confirm = useConfirm();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    amcuCustomerId: '',
    name: '',
    phone: '',
    address: '',
    milkTypeDefault: 'COW',
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // New state handling for menu anchor
  const [menuState, setMenuState] = useState<{ id: number; anchor: HTMLElement } | null>(null);

  useEffect(() => {
    loadCustomers();
    const interval = setInterval(loadCustomers, 30000);
    const handleFocus = () => loadCustomers();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [search]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await customerApi.getAll({ search, limit: 100 });
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, formData);
      } else {
        await customerApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      amcuCustomerId: customer.amcu_customer_id,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      milkTypeDefault: customer.milk_type_default,
      password: ''
    });
    setShowModal(true);
    setMenuState(null);
  };

  const handleDelete = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    setMenuState(null);
    
    const confirmed = await confirm({
      title: 'Delete Customer?',
      message: `This will permanently delete ${customer?.name || 'this customer'} and all their milk entries, payments, and advances.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await customerApi.delete(id);
      loadCustomers();
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
    }
  };

  const handleWhatsApp = (customer: Customer) => {
    const message = `*My Dairy Payment Summary*\nName: ${customer.name}\nBalance: ₹${customer.balance}\nMilk Type: ${customer.milk_type_default}\nTotal Milk: ${customer.total_milk_amount}L`;
    const phone = customer.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('No phone number available for this customer');
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      amcuCustomerId: '',
      name: '',
      phone: '',
      address: '',
      milkTypeDefault: 'COW',
      password: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    if (menuState?.id === id) {
      setMenuState(null);
    } else {
      setMenuState({ id, anchor: e.currentTarget });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Customers
          </h1>
          <p className="text-slate-500 mt-1">Manage your milk suppliers and their accounts</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or phone..."
          className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md"
        />
      </div>

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={6} cols={5} />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No customers found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Get started by adding your first customer to the system.
            </p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-200"
            >
              <Plus className="w-4 h-4" />
              Add First Customer
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Contact</th>
                    <th className="px-6 py-4 font-medium">Milk Type</th>
                    <th className="px-6 py-4 font-medium text-right">Total Milk</th>
                    <th className="px-6 py-4 font-medium text-right">Balance</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-slate-900 font-medium font-heading">{customer.name}</p>
                            <p className="text-xs text-slate-400 font-mono">#{customer.amcu_customer_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {customer.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {customer.phone}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{customer.address}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          customer.milk_type_default === 'COW' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : customer.milk_type_default === 'BUFFALO'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {customer.milk_type_default}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-900 font-medium">{customer.total_milk_amount?.toFixed(1) || '0.0'}</span>
                        <span className="text-slate-400 text-xs ml-1">L</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold ${customer.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {formatCurrency(customer.balance || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => toggleMenu(e, customer.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            menuState?.id === customer.id 
                              ? 'bg-slate-100 text-slate-900' 
                              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Padding row */}
                  <tr className="h-24"></tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Visible < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {customers.map((customer) => (
                <div key={customer.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium">{customer.name}</p>
                        <p className="text-xs text-slate-400 font-mono">#{customer.amcu_customer_id}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => toggleMenu(e, customer.id)}
                        className={`p-2 rounded-lg transition-colors ${
                            menuState?.id === customer.id 
                              ? 'bg-slate-100 text-slate-900' 
                              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                          }`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Balance</p>
                      <p className={`font-bold ${customer.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(customer.balance || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">Milk Type</p>
                      <span className="text-sm font-medium text-slate-900">{customer.milk_type_default}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Menu (Shared) */}
            {menuState && (() => {
              const currentId = menuState.id;
              const currentCustomer = customers.find(c => c.id === currentId);
              if (!currentCustomer) return null;
              return (
               <ActionMenu 
                  anchorEl={menuState.anchor}
                  onEdit={() => handleEdit(currentCustomer)}
                  onDelete={() => handleDelete(currentId)}
                  onWhatsApp={() => handleWhatsApp(currentCustomer)}
                  onClose={() => setMenuState(null)}
               />
              );
            })()}
          </>
        )}
      </div>

      {/* Premium Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        footer={
          <div className="flex gap-3">
             <button 
               type="button" 
               onClick={() => setShowModal(false)} 
               className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium"
             >
               Cancel
             </button>
             <button 
               onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e as unknown as React.FormEvent)}
               disabled={isSaving} 
               className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
             >
               {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
               {editingCustomer ? 'Update Customer' : 'Create Customer'}
             </button>
          </div>
        }
      >
            <form id="customerForm" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">AMCU ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.amcuCustomerId}
                    onChange={(e) => setFormData({ ...formData, amcuCustomerId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    required
                    disabled={!!editingCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Milk Type</label>
                  <Select
                    value={formData.milkTypeDefault}
                    onChange={(val) => setFormData({ ...formData, milkTypeDefault: val })}
                    options={[
                        { value: 'COW', label: 'Cow' },
                        { value: 'BUFFALO', label: 'Buffalo' },
                        { value: 'MIXED', label: 'Mixed' }
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  {editingCustomer ? 'New Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </form>
      </Modal>
    </div>
  );
}
