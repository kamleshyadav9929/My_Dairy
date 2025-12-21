import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { entryApi, customerApi } from '../lib/api';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Milk,
  Calendar,
  Droplets,
  MoreVertical,
  MessageCircle,
  User,
  Zap,
  ZapOff,
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface Entry {
  id: number;
  customer_id: number;
  customer_name: string;
  amcu_customer_id: string;
  date: string;
  time: string;
  shift: string;
  milk_type: string;
  quantity_litre: number;
  fat: number | null;
  snf: number | null;
  rate_per_litre: number;
  amount: number;
  source: string;
}

interface Customer {
  id: number;
  amcu_customer_id: string;
  name: string;
  phone: string | null;
  milk_type_default: string;
}

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

interface RateCard {
  id: number;
  milk_type: string;
  min_fat: number | null;
  max_fat: number | null;
  min_snf: number | null;
  max_snf: number | null;
  rate_per_litre: number;
  is_active: number;
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
  onWhatsApp?: () => void,
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
        {onWhatsApp && (
          <button 
            onClick={(e) => { e.stopPropagation(); onWhatsApp(); onClose(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Send WhatsApp
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
        >
          <Edit className="w-4 h-4" /> Edit Entry
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
        >
          <Trash2 className="w-4 h-4" /> Delete Entry
        </button>
      </div>
    </>,
    document.body
  );
};

export default function EntriesPage() {
  const confirmDialog = useConfirm();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dateFrom, setDateFrom] = useState(getLocalDate());
  const [dateTo, setDateTo] = useState(getLocalDate());
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    date: getLocalDate(),
    shift: new Date().getHours() < 12 ? 'M' : 'E',
    milkType: 'COW',
    quantityLitre: '',
    fat: '',
    snf: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // New state handling for menu anchor
  const [menuState, setMenuState] = useState<{ id: number; anchor: HTMLElement } | null>(null);

  /* Rate Calculation Logic */

  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [calculatedRate, setCalculatedRate] = useState<number>(0);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  /* Rapid Entry Mode - for high-volume data entry */
  const [rapidModeEnabled, setRapidModeEnabled] = useState(false);
  const [rapidFormData, setRapidFormData] = useState({
    customerId: '',
    quantityLitre: '',
    fat: '',
    snf: ''
  });
  const [rapidSaving, setRapidSaving] = useState(false);
  const [rapidRate, setRapidRate] = useState(0);
  const [rapidAmount, setRapidAmount] = useState(0);
  const rapidCustomerRef = useRef<HTMLInputElement>(null);
  const rapidQtyRef = useRef<HTMLInputElement>(null);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadCustomers();
    loadRateData();
  }, []);

  const loadRateData = async () => {
    try {
      const [cardsRes, settingsRes] = await Promise.all([
        import('../lib/api').then(m => m.settingsApi.getRateCards()),
        import('../lib/api').then(m => m.settingsApi.getAll())
      ]);
      setRateCards(cardsRes.data.rateCards || []);
      setSettings(settingsRes.data.settings || {});
    } catch (error) {
      console.error('Failed to load rate data:', error);
    }
  };

  const calculateRate = useCallback((type: string, fat: number, snf: number) => {
    const card = rateCards.find(c => 
      c.milk_type === type &&
      Boolean(c.is_active) &&
      (c.min_fat === null || fat >= c.min_fat) &&
      (c.max_fat === null || fat < c.max_fat) &&
      (c.min_snf === null || snf >= c.min_snf) &&
      (c.max_snf === null || snf < c.max_snf)
    );

    if (card) return card.rate_per_litre;
    return 0;
  }, [rateCards, settings]);

  useEffect(() => {
    if (!showModal) return;

    const qty = parseFloat(formData.quantityLitre) || 0;
    const fat = parseFloat(formData.fat) || 0;
    const snf = parseFloat(formData.snf) || 0;
    
    if (qty > 0) {
       const rate = calculateRate(formData.milkType, fat, snf);
       setCalculatedRate(rate);
       setCalculatedAmount(qty * rate);
    } else {
       setCalculatedRate(0);
       setCalculatedAmount(0);
    }
  }, [formData.quantityLitre, formData.fat, formData.snf, formData.milkType, showModal, calculateRate]);

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await entryApi.getAll({
        from: dateFrom,
        to: dateTo,
        customerId: selectedCustomer ? parseInt(selectedCustomer) : undefined,
        limit: 200
      });
      setEntries(res.data.entries || []);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, selectedCustomer]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const loadCustomers = async () => {
    try {
      const res = await customerApi.getAll({ limit: 500 });
      setCustomers(res.data.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data = {
        customerId: parseInt(formData.customerId),
        date: formData.date,
        shift: formData.shift,
        milkType: formData.milkType,
        quantityLitre: parseFloat(formData.quantityLitre),
        fat: formData.fat ? parseFloat(formData.fat) : undefined,
        snf: formData.snf ? parseFloat(formData.snf) : undefined
      };

      if (editingEntry) {
        await entryApi.update(editingEntry.id, data);
      } else {
        await entryApi.create(data);
      }
      setShowModal(false);
      resetForm();
      loadEntries();
    } catch (error) {
      console.error('Failed to save entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setFormData({
      customerId: entry.customer_id.toString(),
      date: entry.date,
      shift: entry.shift,
      milkType: entry.milk_type,
      quantityLitre: entry.quantity_litre.toString(),
      fat: entry.fat?.toString() || '',
      snf: entry.snf?.toString() || ''
    });
    setShowModal(true);
    setMenuState(null);
  };

  const handleDelete = async (id: number) => {
    setMenuState(null);
    
    const confirmed = await confirmDialog({
      title: 'Delete Entry?',
      message: 'This will permanently delete this milk entry. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      await entryApi.delete(id);
      loadEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      customerId: '',
      date: getLocalDate(),
      shift: new Date().getHours() < 12 ? 'M' : 'E',
      milkType: 'COW',
      quantityLitre: '',
      fat: '',
      snf: ''
    });
    setCalculatedRate(0);
    setCalculatedAmount(0);
  };

  // Rapid mode rate calculation
  useEffect(() => {
    if (!rapidModeEnabled) return;

    const customer = customers.find(c => c.id.toString() === rapidFormData.customerId);
    const qty = parseFloat(rapidFormData.quantityLitre) || 0;
    const fat = parseFloat(rapidFormData.fat) || 0;
    const snf = parseFloat(rapidFormData.snf) || 0;
    const milkType = customer?.milk_type_default || 'COW';
    
    if (qty > 0) {
      const rate = calculateRate(milkType, fat, snf);
      setRapidRate(rate);
      setRapidAmount(qty * rate);
    } else {
      setRapidRate(0);
      setRapidAmount(0);
    }
  }, [rapidFormData, rapidModeEnabled, customers, calculateRate]);

  // Rapid submit handler - saves entry without closing a modal
  const handleRapidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rapidSaving) return;
    
    const customer = customers.find(c => c.id.toString() === rapidFormData.customerId);
    if (!customer) {
      showToast('Please select a customer', 'error');
      return;
    }
    
    const qty = parseFloat(rapidFormData.quantityLitre);
    if (!qty || qty <= 0) {
      showToast('Please enter quantity', 'error');
      rapidQtyRef.current?.focus();
      return;
    }

    setRapidSaving(true);

    try {
      const data = {
        customerId: parseInt(rapidFormData.customerId),
        date: getLocalDate(),
        shift: new Date().getHours() < 12 ? 'M' : 'E',
        milkType: customer.milk_type_default || 'COW',
        quantityLitre: qty,
        fat: rapidFormData.fat ? parseFloat(rapidFormData.fat) : undefined,
        snf: rapidFormData.snf ? parseFloat(rapidFormData.snf) : undefined
      };

      const response = await entryApi.create(data);
      const newEntry = response.data.entry;
      
      // Prepend new entry to local state (no full reload)
      if (newEntry) {
        setEntries(prev => [{ 
          ...newEntry, 
          customer_name: customer.name,
          amcu_customer_id: customer.amcu_customer_id
        }, ...prev]);
      } else {
        // Fallback: reload entries if API doesn't return the created entry
        loadEntries();
      }
      
      // Show success toast
      showToast(`✓ Saved: ${customer.name} - ${qty}L`, 'success');
      
      // Clear form (keep date/shift auto-set)
      setRapidFormData({
        customerId: '',
        quantityLitre: '',
        fat: '',
        snf: ''
      });
      setRapidRate(0);
      setRapidAmount(0);
      
      // Refocus customer input for next entry
      setTimeout(() => {
        rapidCustomerRef.current?.focus();
      }, 50);
      
    } catch (error) {
      console.error('Rapid save failed:', error);
      showToast('Failed to save entry', 'error');
    } finally {
      setRapidSaving(false);
    }
  };

  const handleWhatsApp = (entry: Entry) => {
    const customer = customers.find(c => c.id === entry.customer_id);
    const phone = customer?.phone?.replace(/\D/g, '');
    
    if (!phone) {
      alert('No phone number found for this customer. Please update customer details.');
      return;
    }

    const formattedDate = new Date(entry.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const message = `🥛 *Milk Entry Receipt*
━━━━━━━━━━━━━━━
📅 Date: ${formattedDate}
⏰ Shift: ${entry.shift === 'M' ? 'Morning' : 'Evening'}
🐄 Type: ${entry.milk_type}

📊 *Details:*
• Quantity: ${entry.quantity_litre} L
• Fat: ${entry.fat || '-'}%
• SNF: ${entry.snf || '-'}%
• Rate: ₹${entry.rate_per_litre}/L

💰 *Amount: ₹${entry.amount.toFixed(0)}*
━━━━━━━━━━━━━━━
Thank you! 🙏`;

    const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const totalLitres = entries.reduce((sum, e) => sum + e.quantity_litre, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  const customerOptions = customers.map(c => ({
    value: c.id,
    label: c.name,
    subLabel: `#${c.amcu_customer_id}`
  }));

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
      {/* Toast Container for notifications */}
      <ToastContainer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">
            Milk Entries
          </h1>
          <p className="text-slate-500 mt-1">Record and manage daily milk collections</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Rapid Mode Toggle */}
          <button
            onClick={() => setRapidModeEnabled(!rapidModeEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium ${
              rapidModeEnabled
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {rapidModeEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            <span className="hidden sm:inline">{rapidModeEnabled ? 'Rapid Mode' : 'Enable Rapid'}</span>
          </button>
          
          {/* New Entry Button (Modal) */}
          {!rapidModeEnabled && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Rapid Entry Inline Form */}
      {rapidModeEnabled && (
        <form 
          onSubmit={handleRapidSubmit}
          className="glass-card p-4 border-2 border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-amber-700 uppercase tracking-wider">Rapid Entry Mode</span>
            <span className="ml-auto text-xs text-slate-500">
              {new Date().getHours() < 12 ? '☀️ Morning Shift' : '🌙 Evening Shift'} • {getLocalDate()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Customer Select */}
            <div className="sm:col-span-4">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Customer</label>
              <Select
                value={rapidFormData.customerId}
                onChange={(val) => {
                  setRapidFormData({ ...rapidFormData, customerId: val });
                  // Auto-focus quantity after customer select
                  setTimeout(() => rapidQtyRef.current?.focus(), 100);
                }}
                options={customerOptions}
                placeholder="Select customer..."
                searchable
              />
            </div>
            
            {/* Quantity */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Qty (L)</label>
              <input
                ref={rapidQtyRef}
                type="number"
                step="0.1"
                min="0"
                value={rapidFormData.quantityLitre}
                onChange={(e) => setRapidFormData({ ...rapidFormData, quantityLitre: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRapidSubmit(e);
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-bold text-lg"
                placeholder="0.0"
              />
            </div>
            
            {/* Fat */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Fat %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={rapidFormData.fat}
                onChange={(e) => setRapidFormData({ ...rapidFormData, fat: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRapidSubmit(e);
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                placeholder="0.0"
              />
            </div>
            
            {/* SNF */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">SNF %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={rapidFormData.snf}
                onChange={(e) => setRapidFormData({ ...rapidFormData, snf: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRapidSubmit(e);
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                placeholder="0.0"
              />
            </div>
            
            {/* Submit Button */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={rapidSaving || !rapidFormData.customerId || !rapidFormData.quantityLitre}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold shadow-lg shadow-emerald-500/25"
              >
                {rapidSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Live Rate Preview */}
          {rapidFormData.customerId && parseFloat(rapidFormData.quantityLitre) > 0 && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-slate-500">
                Rate: <span className="font-bold text-slate-700">₹{rapidRate.toFixed(2)}/L</span>
              </span>
              <span className="text-emerald-600 font-bold">
                Amount: ₹{rapidAmount.toFixed(0)}
              </span>
            </div>
          )}
        </form>
      )}

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 glass-card p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-slate-900 text-sm focus:outline-none"
              />
              <span className="text-slate-600">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-slate-900 text-sm focus:outline-none"
              />
            </div>
            
            <div className="w-full sm:w-auto flex-1 min-w-[200px] relative z-20">
              <Select
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                options={[{ value: '', label: 'All Customers' }, ...customerOptions]}
                placeholder="All Customers"
                searchable
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-4 backdrop-blur-sm flex flex-col justify-center shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-indigo-600 text-xs font-medium">Total Volume</span>
            <Droplets className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalLitres.toFixed(1)}</span>
            <span className="text-sm text-indigo-700 mb-1">Litres</span>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-200 flex items-center justify-between">
            <span className="text-indigo-600 text-xs">Revenue</span>
            <span className="text-sm font-bold text-indigo-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} cols={6} />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Milk className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No entries found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Try adjusting your filters or add a new milk collection entry.
            </p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-xl transition-colors border border-slate-200"
            >
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Shift</th>
                    <th className="px-6 py-4 font-medium">Details</th>
                    <th className="px-6 py-4 font-medium text-right">Quantity</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                    <th className="px-6 py-4 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 text-sm font-medium">{entry.date}</span>
                          <span className="text-slate-500 text-xs font-mono">{entry.time || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                            {entry.customer_name.substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-900 text-sm font-medium group-hover:text-indigo-600 transition-colors">{entry.customer_name}</p>
                            <p className="text-xs text-slate-500">#{entry.amcu_customer_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          entry.shift === 'M' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {entry.shift === 'M' ? 'Morning' : 'Evening'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                           <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700">
                            {entry.milk_type}
                          </span>
                          {(entry.fat || entry.snf) && (
                            <span className="text-xs">
                              Fat: {entry.fat || '-'} / SNF: {entry.snf || '-'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-900 font-bold">{entry.quantity_litre}</span>
                        <span className="text-slate-500 text-xs ml-1">L</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div>
                          <span className="text-emerald-600 font-bold">{formatCurrency(entry.amount)}</span>
                          <p className="text-xs text-slate-500">@ ₹{entry.rate_per_litre}/L</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 relative">
                        <button 
                          onClick={(e) => toggleMenu(e, entry.id)}
                          className={`p-2 rounded-lg transition-colors ${
                               menuState?.id === entry.id 
                                 ? 'bg-slate-100 text-slate-900' 
                                 : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                             }`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Padding row to allow dropdown to not look weird if last row */}
                  <tr className="h-24"></tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium text-sm">{entry.customer_name}</p>
                        <p className="text-xs text-slate-500 font-mono">#{entry.amcu_customer_id}</p>
                      </div>
                    </div>
                    <div className="relative">
                       <button 
                         onClick={(e) => toggleMenu(e, entry.id)}
                         className={`p-2 rounded-lg transition-colors ${
                               menuState?.id === entry.id 
                                 ? 'bg-slate-100 text-slate-900' 
                                 : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                             }`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-1">Date & Shift</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-900">{entry.date}</span>
                         <span className={`inline-flex px-1.5 rounded text-[10px] font-bold border ${
                          entry.shift === 'M' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {entry.shift}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-500 mb-1">Quantity/Amt</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{entry.quantity_litre}L</span>
                        <span className="mx-1 text-slate-600">/</span>
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(entry.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Action Menu (Shared) */}
            {menuState && (
               <ActionMenu 
                  anchorEl={menuState.anchor}
                  onEdit={() => entries.find(e => e.id === menuState.id) && handleEdit(entries.find(e => e.id === menuState.id)!)}
                  onDelete={() => entries.find(e => e.id === menuState.id) && handleDelete(menuState.id)}
                  onWhatsApp={() => entries.find(e => e.id === menuState.id) && handleWhatsApp(entries.find(e => e.id === menuState.id)!)}
                  onClose={() => setMenuState(null)}
               />
            )}
          </>
        )}
      </div>

      {/* Premium Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEntry ? 'Edit Entry' : 'New Milk Entry'}
        footer={
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e as unknown as React.FormEvent)}
              disabled={isSaving} 
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {editingEntry ? 'Update Entry' : 'Record Entry'}
            </button>
          </div>
        }
      >
        <form id="entryForm" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500">Customer <span className="text-red-400">*</span></label>
            <div className="relative">
              <Select
                value={formData.customerId}
                onChange={(val) => {
                  const customer = customers.find(c => c.id.toString() === val);
                  setFormData({ 
                    ...formData, 
                    customerId: val,
                    milkType: customer?.milk_type_default || formData.milkType
                  });
                }}
                options={customerOptions}
                placeholder="Select customer"
                searchable
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Shift <span className="text-red-400">*</span></label>
               <Select
                value={formData.shift}
                onChange={(val) => setFormData({ ...formData, shift: val })}
                options={[
                    { value: 'M', label: 'Morning' },
                    { value: 'E', label: 'Evening' }
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Type <span className="text-red-400">*</span></label>
               <Select
                value={formData.milkType}
                onChange={(val) => setFormData({ ...formData, milkType: val })}
                options={[
                    { value: 'COW', label: 'Cow' },
                    { value: 'BUFFALO', label: 'Buffalo' },
                    { value: 'MIXED', label: 'Mixed' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Quantity (L) <span className="text-red-400">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantityLitre}
                onChange={(e) => setFormData({ ...formData, quantityLitre: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                required
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Fat %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">SNF %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={formData.snf}
                onChange={(e) => setFormData({ ...formData, snf: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-indigo-200 mt-4">
            <div>
               <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estimated Rate</label>
               <p className="text-xl font-bold text-slate-900">₹{calculatedRate.toFixed(2)}<span className="text-xs font-normal text-slate-500 ml-1">/L</span></p>
            </div>
             <div className="text-right">
               <label className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Total Amount</label>
               <p className="text-2xl font-bold text-emerald-400">₹{calculatedAmount.toFixed(0)}</p>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
