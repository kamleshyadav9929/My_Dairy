import { useState, useEffect, useMemo, useCallback } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { generatePassbookPDF } from '../../utils/pdfExport';
import { generatePassbookShareMessage, shareNative } from '../utils/shareUtils';
import { getCacheIgnoreExpiry, setCache, CACHE_KEYS } from '../../lib/cache';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Download, Loader2, Milk, IndianRupee, Share2, ChevronLeft, ChevronRight, Sunrise, Moon } from 'lucide-react';

// Skeleton Components
function SkeletonBalance() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="skeleton h-4 w-24 mb-2" />
      <div className="skeleton h-10 w-36 mb-4" />
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div>
          <div className="skeleton h-3 w-14 mb-2" />
          <div className="skeleton h-5 w-20" />
        </div>
        <div>
          <div className="skeleton h-3 w-14 mb-2" />
          <div className="skeleton h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTransactions() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="skeleton h-5 w-32" />
      </div>
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-24 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="skeleton h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Passbook() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const [data, setData] = useState<any>(() => getCacheIgnoreExpiry(CACHE_KEYS.PASSBOOK_ENTRIES));
  const [loading, setLoading] = useState(() => !getCacheIgnoreExpiry(CACHE_KEYS.PASSBOOK_ENTRIES));
  const [downloading, setDownloading] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'milk' | 'payment'>('all');
  
  // Month navigation - null means "All Time"
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null); // null = All Time (default)
  
  const getMonthRange = (date: Date | null) => {
    if (!date) {
      // All time: from 2020 to today
      return {
        from: '2020-01-01',
        to: new Date().toISOString().split('T')[0]
      };
    }
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0]
    };
  };

  const { from: fromDate, to: toDate } = getMonthRange(currentMonth);

  const loadPassbook = useCallback(async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await customerPortalApi.getPassbook({ from: fromDate, to: toDate });
      setData(res.data);
      // Cache for 30 minutes
      setCache(CACHE_KEYS.PASSBOOK_ENTRIES, res.data, 30 * 60 * 1000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, isOffline]);

  useEffect(() => {
    loadPassbook();
  }, [loadPassbook]);

  const goToPrevMonth = () => {
    if (!currentMonth) {
      // If in All Time mode, go to current month
      setCurrentMonth(new Date());
    } else {
      setCurrentMonth(prev => prev ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1) : new Date());
    }
  };

  const goToNextMonth = () => {
    if (!currentMonth) return;
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date()) {
      setCurrentMonth(next);
    }
  };

  const isAllTime = currentMonth === null;
  const isCurrentMonthSelected = currentMonth ? 
    (currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()) : 
    false;

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    
    let filtered = data.transactions;
    if (transactionFilter === 'milk') filtered = filtered.filter((t: any) => t.type === 'MILK');
    if (transactionFilter === 'payment') filtered = filtered.filter((t: any) => t.type === 'PAYMENT');
    
    return filtered;
  }, [data?.transactions, transactionFilter]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    [...filteredTransactions].reverse().forEach((t: any) => {
      const dateKey = t.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    
    return groups;
  }, [filteredTransactions]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const handleDownloadPDF = async () => {
    if (!data || !data.transactions) return;
    
    setDownloading(true);
    try {
      const totalLitres = data.transactions
        .filter((row: any) => row.type === 'MILK')
        .reduce((sum: number, row: any) => sum + (Number(row.details?.quantity_litre) || 0), 0);

      const entries = data.transactions.map((row: any) => ({
        date: row.date || '',
        type: row.type === 'MILK' ? 'entry' : 'payment',
        description: row.type === 'MILK' 
          ? `${row.details?.quantity_litre || 0}L ${row.details?.shift === 'M' ? 'Morning' : 'Evening'}`
          : row.description || 'Payment',
        debit: Number(row.debit) || 0,
        credit: Number(row.credit) || 0,
        balance: Number(row.balance) || 0,
      }));

      const pdfData = {
        customer: {
          name: user?.name || 'Customer',
          amcuId: user?.amcuId || String(user?.customerId) || '-',
        },
        entries,
        summary: {
          totalLitres: totalLitres,
          totalAmount: Number(data.summary?.totalMilkAmount) || 0,
          totalPayments: Number(data.summary?.totalPayments) || 0,
          totalAdvances: Number(data.summary?.totalAdvances) || 0,
          balance: Number(data.summary?.balance) || 0,
        },
        period: { from: fromDate, to: toDate },
      };

      generatePassbookPDF(pdfData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(Math.abs(amount));
  };

  const handleShare = async () => {
    if (!data?.summary) return;
    
    const totalMilk = data.transactions
      ?.filter((t: any) => t.type === 'MILK')
      .reduce((sum: number, t: any) => sum + (t.details?.quantity_litre || 0), 0) || 0;
    
    const message = generatePassbookShareMessage({
      customerName: user?.name || 'Customer',
      customerId: user?.amcuId || String(user?.customerId) || '-',
      fromDate,
      toDate,
      totalMilk,
      totalAmount: data.summary.totalMilkAmount || 0,
      totalPayments: data.summary.totalPayments || 0,
      totalAdvances: data.summary.totalAdvances || 0,
      balance: data.summary.balance || 0
    });
    
    await shareNative('My Dairy Passbook', message);
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="space-y-4 pb-4">
        <h2 className="text-xl font-bold text-slate-800">{t('passbook.title')}</h2>
        <SkeletonBalance />
        <SkeletonTransactions />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-xl font-bold text-slate-800">{t('passbook.title')}</h2>

      {/* Balance Card */}
      {data && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              {t('current.balance')}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight mb-3">
            {formatCurrency(data?.summary?.balance || 0)}
          </h3>

          {/* Earned / Received */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 mb-4">
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('earned')}</p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {formatCurrency(data?.summary?.totalMilkAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t('received')}</p>
              <p className="text-base font-semibold text-emerald-600 mt-1">
                {formatCurrency(data?.summary?.totalPayments || 0)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              disabled={!data?.transactions?.length}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 tap-scale"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading || !data?.transactions?.length}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 tap-scale"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
          </div>
        </div>
      )}

      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl p-2 border border-slate-100">
        <button
          onClick={goToPrevMonth}
          className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors tap-scale"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 text-center">
          <p className="font-bold text-slate-800 text-sm">
            {isAllTime ? 'All Time' : currentMonth?.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        </div>
        
        <button
          onClick={goToNextMonth}
          disabled={isAllTime || isCurrentMonthSelected}
          className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed tap-scale"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        
        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        {/* All Time Toggle - same size as arrows */}
        <button
          onClick={() => setCurrentMonth(isAllTime ? new Date() : null)}
          className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all tap-scale ${
            isAllTime 
              ? 'bg-slate-800 text-white font-semibold ' 
              : 'text-slate-900 hover:bg-slate-100'
          }`}
        >
          All
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {[
          { key: 'all', label: t('all'), count: data?.transactions?.length || 0 },
          { key: 'milk', label: t('milk'), icon: Milk, count: data?.transactions?.filter((t: any) => t.type === 'MILK').length || 0 },
          { key: 'payment', label: t('payment'), icon: IndianRupee, count: data?.transactions?.filter((t: any) => t.type === 'PAYMENT').length || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTransactionFilter(tab.key as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              transactionFilter === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              transactionFilter === tab.key 
                ? 'bg-slate-200 text-slate-600' 
                : 'bg-slate-200/70 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Transactions Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs">{t('loading')}</p>
          </div>
        ) : Object.keys(groupedTransactions).length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">{t('no.data')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-slate-50/50 sticky top-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {formatDateLabel(date)}
                  </p>
                </div>
                
                {/* Transactions for this date */}
                {transactions.map((row: any, idx: number) => (
                  <div key={row.id || idx} className="px-4 py-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      row.type === 'MILK' 
                        ? row.details?.shift === 'M' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {row.type === 'MILK' ? (
                        row.details?.shift === 'M' ? <Sunrise className="w-5 h-5" /> : <Moon className="w-5 h-5" />
                      ) : (
                        <IndianRupee className="w-5 h-5" />
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">
                        {row.type === 'MILK' 
                          ? `${row.details?.shift === 'M' ? t('morning') : t('evening')} Collection`
                          : t('payment.received')
                        }
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {row.type === 'MILK' 
                          ? `${row.details?.quantity_litre || 0}L • Fat: ${row.details?.fat || '-'}%`
                          : row.description
                        }
                      </p>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm ${
                        row.credit > 0 ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {row.credit > 0 ? '+' : '-'}{formatCurrency(row.credit || row.debit)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Bal: {formatCurrency(row.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
