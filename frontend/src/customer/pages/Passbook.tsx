import { useState, useEffect, useMemo } from 'react';
import { customerPortalApi } from '../../lib/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { generatePassbookPDF } from '../../utils/pdfExport';
import { generatePassbookShareMessage, shareNative } from '../utils/shareUtils';
import { Filter, Download, Loader2, Milk, IndianRupee, Share2 } from 'lucide-react';

export default function Passbook() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'milk' | 'payment'>('all');
  
  // Default: Current month
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    loadPassbook();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPassbook = async () => {
    setLoading(true);
    try {
      const res = await customerPortalApi.getPassbook({ from: fromDate, to: toDate });
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on selected type
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    
    if (transactionFilter === 'all') return data.transactions;
    if (transactionFilter === 'milk') return data.transactions.filter((t: any) => t.type === 'MILK');
    if (transactionFilter === 'payment') return data.transactions.filter((t: any) => t.type === 'PAYMENT');
    return data.transactions;
  }, [data?.transactions, transactionFilter]);

  const handleDownloadPDF = async () => {
    if (!data || !data.transactions) return;
    
    setDownloading(true);
    try {
      // Calculate total litres from transactions
      const totalLitres = data.transactions
        .filter((row: any) => row.type === 'MILK')
        .reduce((sum: number, row: any) => sum + (Number(row.details?.quantity_litre) || 0), 0);

      // Transform transactions to passbook entries format
      const entries = data.transactions.map((row: any) => ({
        date: row.date || '',
        type: row.type === 'MILK' ? 'entry' : 'payment',
        description: row.type === 'MILK' 
          ? `${row.details?.quantity_litre || 0}L ${row.details?.shift === 'M' ? 'Morning' : 'Evening'} - Fat: ${row.details?.fat || 0}%, SNF: ${row.details?.snf || 0}%`
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
        period: {
          from: fromDate,
          to: toDate,
        },
      };

      generatePassbookPDF(pdfData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(amount));
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

  return (
    <div className="p-4 pb-20 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('passbook.title')}</h2>

      {/* Hero Card - Balance */}
      {data && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
           <p className="text-slate-400 text-sm font-medium mb-1">{t('closing.balance')}</p>
           <h3 className="text-4xl font-bold tracking-tight mb-4">{formatCurrency(data?.summary?.balance || 0)}</h3>
           <div className="flex items-center gap-4 text-sm opacity-80">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${(data?.summary?.balance || 0) >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                 <span>{(data?.summary?.balance || 0) >= 0 ? t('credit.status') : t('debit.status')}</span>
              </div>
           </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">{t('date.from')}</label>
            <input 
              type="date" 
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full p-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              style={{ colorScheme: 'light' }}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">{t('date.to')}</label>
            <input 
              type="date" 
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full p-3 bg-slate-50 rounded-xl text-sm font-semibold text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>
        <button 
          onClick={loadPassbook}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
        >
          <Filter className="w-4 h-4" /> {t('update.statement')}
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header with PDF Download and Share */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{t('recent.transactions')}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              disabled={!data?.transactions?.length}
              className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              title="Share via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">Share</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading || !data?.transactions?.length}
              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              title="Download PDF"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="text-xs font-medium hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Transaction Type Filter Tabs */}
        <div className="px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTransactionFilter('all')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                transactionFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('all')}
              {data?.transactions && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  transactionFilter === 'all' ? 'bg-slate-200 text-slate-600' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  {data.transactions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTransactionFilter('milk')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                transactionFilter === 'milk'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Milk className="w-3.5 h-3.5" />
              {t('milk')}
              {data?.transactions && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  transactionFilter === 'milk' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  {data.transactions.filter((t: any) => t.type === 'MILK').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTransactionFilter('payment')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                transactionFilter === 'payment'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              {t('payment')}
              {data?.transactions && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  transactionFilter === 'payment' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  {data.transactions.filter((t: any) => t.type === 'PAYMENT').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
             <div className="p-12 flex flex-col items-center justify-center text-slate-400">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
               <p className="text-xs font-medium uppercase tracking-widest">{t('loading')}</p>
             </div>
        ) : filteredTransactions.length === 0 ? (
             <div className="p-12 text-center text-slate-400 text-sm">
               {transactionFilter === 'all' ? t('no.data') : `No ${transactionFilter} transactions found`}
             </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredTransactions.slice().reverse().map((row: any, idx: number) => (
              <div key={idx} className="p-5 hover:bg-slate-50 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      row.type === 'MILK' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {row.type === 'MILK' ? 'M' : '₹'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {row.type === 'MILK' ? `${t('milk.supply')} (${row.details?.shift === 'M' ? t('morning') : t('evening')})` : t('payment.received')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {row.type}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${
                    row.credit > 0 ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {row.credit > 0 ? '+' : ''}{formatCurrency(row.credit || row.debit)}
                  </span>
                </div>
                
                <div className="pl-13 flex justify-between items-end">
                  <div className="text-xs text-slate-500 leading-relaxed">
                    {row.type === 'MILK' ? (
                      <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">
                        {row.details?.quantity_litre || 0}L @ {t('milk.fat')} {row.details?.fat || 0} / {t('milk.snf')} {row.details?.snf || 0}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">via {row.description}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-300 uppercase tracking-wider mb-0.5">{t('balance')}</p>
                    <p className="text-xs font-bold text-slate-600">{formatCurrency(row.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
