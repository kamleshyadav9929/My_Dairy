import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Alert, Share, StatusBar } from 'react-native';
import { ChevronRight, ChevronLeft, Download, Share2, Wallet, CloudRain, CreditCard, Moon } from 'lucide-react-native';
import { customerPortalApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { generatePassbookPDF } from '../lib/pdfUtils';

interface PassbookEntry {
  id: string;
  type: string;
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  details?: any;
}

export default function PassbookScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [transactions, setTransactions] = useState<PassbookEntry[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'milk' | 'payment'>('all');
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const fromDate = currentMonth ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0] : '2020-01-01';
      const toDate = currentMonth ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      const res = await customerPortalApi.getPassbook({ from: fromDate, to: toDate });
      setTransactions(res.data.transactions || []);
      setSummary(res.data.summary || {});
    } catch (error) {
      console.error('Passbook load error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [currentMonth]);

  const filtered = useMemo(() => {
    if (transactionFilter === 'all') return transactions;
    return transactions.filter(t => t.type.toLowerCase() === transactionFilter);
  }, [transactions, transactionFilter]);

  // Group transactions by Date if needed, or just list them reverse chronologically
  const reversedList = useMemo(() => [...filtered].reverse(), [filtered]);

  const formatCurrency = (val: number) => '₹' + Math.abs(val || 0).toLocaleString('en-IN');
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };
  const getDayMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  const handleShare = async () => {
    if (!summary) return;
    const message = `Balance: ${formatCurrency(summary.balance)}`;
    await Share.share({ message });
  };
  
  const handleDownload = async () => {
     Alert.alert('Coming Soon', 'PDF Download will be available shortly.');
  };

  const MilkIcon = () => (
     <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
        <Moon size={20} color="#6366f1" {...({} as any)} />
     </View>
  );

  const PaymentIcon = () => (
     <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center">
        <CreditCard size={20} color="#10b981" {...({} as any)} />
     </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header Title */}
      <View className="px-6 py-4 bg-white border-b border-slate-100">
        <Text className="text-xl font-bold text-slate-900">Passbook</Text>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        {/* Closing Balance Hero Card (Dark) */}
        <View className="bg-slate-900 rounded-2xl p-6 mb-4 shadow-xl shadow-slate-300">
          <Text className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Closing Balance</Text>
          <Text className="text-white text-4xl font-bold mb-6">{formatCurrency(summary?.balance)}</Text>
          
          <View className="flex-row gap-3">
             <TouchableOpacity onPress={handleShare} className="flex-1 bg-slate-800 rounded-lg py-3 flex-row items-center justify-center border border-slate-700">
                <Share2 size={16} color="white" className="mr-2" {...({} as any)} />
                <Text className="text-white font-semibold">Share</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={handleDownload} className="flex-1 bg-slate-800 rounded-lg py-3 flex-row items-center justify-center border border-slate-700">
                <Download size={16} color="white" className="mr-2" {...({} as any)} />
                <Text className="text-white font-semibold">PDF</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Date Filter Bar */}
        <View className="flex-row items-center justify-between bg-white p-2 rounded-xl border border-slate-100 mb-4">
           <TouchableOpacity onPress={() => setCurrentMonth(prev => {
              if(!prev) return new Date();
              const d = new Date(prev); d.setMonth(d.getMonth()-1); return d;
           })}>
              <ChevronLeft size={20} color="#64748b" {...({} as any)} />
           </TouchableOpacity>
           
           <Text className="text-slate-900 font-bold">
              {currentMonth ? currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'All Time'}
           </Text>
           
           <View className="flex-row items-center">
             <TouchableOpacity onPress={() => setCurrentMonth(prev => {
                if(!prev) return null;
                const d = new Date(prev); d.setMonth(d.getMonth()+1); return d;
             })} className="mr-2">
                <ChevronRight size={20} color="#64748b" {...({} as any)} />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setCurrentMonth(currentMonth ? null : new Date())} className="bg-slate-900 px-3 py-1 rounded-lg">
                <Text className="text-white text-xs font-bold">{currentMonth ? 'All' : 'Month'}</Text>
             </TouchableOpacity>
           </View>
        </View>

        {/* Counts/Tabs */}
        <View className="flex-row gap-3 mb-6 bg-slate-100 p-1 rounded-xl">
           {['all', 'milk', 'payment'].map((f) => (
             <TouchableOpacity 
               key={f} 
               onPress={() => setTransactionFilter(f as any)}
               className={`flex-1 py-2 items-center justify-center rounded-lg ${transactionFilter === f ? 'bg-white shadow-sm' : ''}`}
             >
                <Text className={`text-xs font-bold capitalize ${transactionFilter === f ? 'text-slate-900' : 'text-slate-500'}`}>
                   {f} {f !== 'all' && <Text className="text-slate-400 ml-1">({transactions.filter(t => t.type.toLowerCase() === f).length})</Text>}
                </Text>
             </TouchableOpacity>
           ))}
        </View>

        {/* Transactions List */}
        <View className="mb-20">
           {loading ? (
             <ActivityIndicator size="large" color="#4f46e5" />
           ) : reversedList.length === 0 ? (
             <View className="items-center py-10">
               <Text className="text-slate-400">No transactions found</Text>
             </View>
           ) : (
             <View className="bg-white rounded-2xl border border-slate-50 overflow-hidden">
                {reversedList.map((item, idx) => (
                  <View key={item.id} className={`p-4 flex-row justify-between items-center ${idx !== 0 ? 'border-t border-slate-50' : ''}`}>
                     <View className="flex-row items-center">
                        {item.type === 'MILK' ? <MilkIcon /> : <PaymentIcon />}
                        <View className="ml-3">
                           <Text className="text-slate-900 font-bold text-sm">
                              {item.type === 'MILK' ? 'Milk Collected' : 'Payment Received'}
                           </Text>
                           <Text className="text-slate-400 text-xs capitalize mt-0.5">
                              {item.type === 'MILK' 
                                ? `${item.details?.shift === 'M' ? 'Morning' : 'Evening'} • ${item.details?.quantity_litre}L` 
                                : item.description}
                           </Text>
                        </View>
                     </View>
                     <View className="items-end">
                        <Text className={`font-bold text-base ${item.credit > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                           {item.credit > 0 ? '+' : ''}{item.credit > 0 ? formatCurrency(item.credit) : formatCurrency(-item.debit)}
                        </Text>
                        <Text className="text-slate-400 text-[10px]">
                           {getDayMonth(item.date)} • Bal: {formatCurrency(item.balance)}
                        </Text>
                     </View>
                  </View>
                ))}
             </View>
           )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
