import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Alert, Share, StatusBar } from 'react-native';
import { ChevronRight, ChevronLeft, Download, Share2, CreditCard, Droplets, FileText, TrendingUp, TrendingDown } from 'lucide-react-native';
import { customerPortalApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { generatePassbookPDF } from '../lib/pdfUtils';
import { LinearGradient } from 'expo-linear-gradient';

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
      console.log('Loading passbook data...');
      const fromDate = currentMonth 
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0] 
        : '2020-01-01';
      const toDate = currentMonth 
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      const res = await customerPortalApi.getPassbook({ from: fromDate, to: toDate });
      console.log('Passbook response:', res.data);
      setTransactions(res.data.transactions || []);
      setSummary(res.data.summary || {});
    } catch (error: any) {
      console.error('Passbook load error:', error);
      console.error('Error details:', error.response?.data || error.message);
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

  const reversedList = useMemo(() => [...filtered].reverse(), [filtered]);

  const formatCurrency = (val: number) => '₹' + Math.abs(val || 0).toLocaleString('en-IN');
  const getDayMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  const handleShare = async () => {
    if (!summary) return;
    const message = `My Dairy Balance: ${formatCurrency(summary.balance)}`;
    await Share.share({ message });
  };
  
  const handleDownload = async () => {
    if (!transactions.length || !summary || !user) {
      Alert.alert('No Data', 'No transactions to export.');
      return;
    }
    
    setDownloading(true);
    try {
      const fromDate = currentMonth 
        ? currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'All Time';
      const toDate = new Date().toLocaleDateString('en-IN');
      
      await generatePassbookPDF({
        customer: {
          name: user.name || 'Customer',
          amcuId: user.amcuId || user.id?.toString() || '-'
        },
        entries: transactions.map(t => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          type: t.type.toLowerCase(),
          description: t.description || (t.type === 'MILK' ? 'Milk Collection' : 'Payment'),
          debit: t.debit || 0,
          credit: t.credit || 0,
          balance: t.balance || 0
        })),
        summary: {
          totalLitres: summary.totalLitres || 0,
          totalAmount: summary.totalMilkAmount || summary.totalAmount || 0,
          totalPayments: summary.totalPayments || 0,
          balance: summary.balance || 0
        },
        period: { from: fromDate, to: toDate }
      });
      Alert.alert('Success', 'PDF generated and ready to share!');
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const milkCount = transactions.filter(t => t.type.toLowerCase() === 'milk').length;
  const paymentCount = transactions.filter(t => t.type.toLowerCase() === 'payment').length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="light-content" backgroundColor="#1e293b" />
      
      {/* Hero Header with Balance */}
      <LinearGradient
        colors={['#1e293b', '#334155']}
        className="px-6 pb-6 pt-4"
      >
        <Text className="text-slate-400 text-sm font-medium mb-1">Passbook</Text>
        
        <View className="flex-row items-end justify-between mb-6">
          <View>
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-1">Current Balance</Text>
            <Text className="text-white text-4xl font-bold">{formatCurrency(summary?.balance)}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={handleShare} 
              className="bg-white/10 w-12 h-12 rounded-xl items-center justify-center border border-white/10"
            >
              <Share2 size={20} color="white" {...({} as any)} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDownload}
              disabled={downloading}
              className="bg-indigo-500 w-12 h-12 rounded-xl items-center justify-center"
            >
              {downloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Download size={20} color="white" {...({} as any)} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/10 rounded-xl p-4 border border-white/5">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={14} color="#4ade80" {...({} as any)} />
              <Text className="text-emerald-400 text-xs ml-1">Earned</Text>
            </View>
            <Text className="text-white font-bold text-lg">{formatCurrency(summary?.totalMilkAmount || 0)}</Text>
          </View>
          <View className="flex-1 bg-white/10 rounded-xl p-4 border border-white/5">
            <View className="flex-row items-center mb-2">
              <TrendingDown size={14} color="#f87171" {...({} as any)} />
              <Text className="text-red-400 text-xs ml-1">Received</Text>
            </View>
            <Text className="text-white font-bold text-lg">{formatCurrency(summary?.totalPayments || 0)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        className="flex-1 -mt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* Month Selector */}
        <View className="mx-6 mt-4 mb-4 flex-row items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <TouchableOpacity 
            onPress={() => setCurrentMonth(prev => {
              if (!prev) return new Date();
              const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d;
            })}
            className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center"
          >
            <ChevronLeft size={20} color="#64748b" {...({} as any)} />
          </TouchableOpacity>
          
          <Text className="text-slate-900 font-bold text-base">
            {currentMonth ? currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'All Time'}
          </Text>
          
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              onPress={() => setCurrentMonth(prev => {
                if (!prev) return null;
                const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d;
              })}
              className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center"
            >
              <ChevronRight size={20} color="#64748b" {...({} as any)} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setCurrentMonth(currentMonth ? null : new Date())} 
              className="bg-slate-900 px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-xs font-bold">{currentMonth ? 'All' : 'This Month'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="mx-6 mb-4 flex-row bg-slate-100 p-1.5 rounded-2xl">
          {[
            { key: 'all', label: 'All', count: transactions.length },
            { key: 'milk', label: 'Milk', count: milkCount },
            { key: 'payment', label: 'Payments', count: paymentCount }
          ].map((f) => (
            <TouchableOpacity 
              key={f.key} 
              onPress={() => setTransactionFilter(f.key as any)}
              className={`flex-1 py-3 items-center justify-center rounded-xl ${transactionFilter === f.key ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-bold ${transactionFilter === f.key ? 'text-slate-900' : 'text-slate-500'}`}>
                {f.label} <Text className="text-slate-400">({f.count})</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        <View className="px-6 pb-24">
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" className="mt-10" />
          ) : reversedList.length === 0 ? (
            <View className="items-center py-16">
              <View className="w-16 h-16 bg-slate-100 rounded-2xl items-center justify-center mb-4">
                <FileText size={32} color="#cbd5e1" {...({} as any)} />
              </View>
              <Text className="text-slate-400 font-medium">No transactions found</Text>
            </View>
          ) : (
            <View className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              {reversedList.map((item, idx) => {
                const isMilk = item.type.toLowerCase() === 'milk';
                return (
                  <View 
                    key={item.id} 
                    className={`p-4 flex-row justify-between items-center ${idx !== 0 ? 'border-t border-slate-50' : ''}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className={`w-11 h-11 rounded-xl items-center justify-center ${isMilk ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                        {isMilk ? (
                          <Droplets size={20} color="#6366f1" {...({} as any)} />
                        ) : (
                          <CreditCard size={20} color="#10b981" {...({} as any)} />
                        )}
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                          {isMilk ? 'Milk Collection' : 'Payment Received'}
                        </Text>
                        <Text className="text-slate-400 text-xs mt-0.5">
                          {isMilk && item.details 
                            ? `${item.details.shift === 'M' ? 'Morning' : 'Evening'} • ${item.details.quantity_litre}L`
                            : item.description}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-base ${item.credit > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {item.credit > 0 ? '+' : ''}{item.credit > 0 ? formatCurrency(item.credit) : formatCurrency(-item.debit)}
                      </Text>
                      <Text className="text-slate-400 text-[10px] mt-0.5">
                        {getDayMonth(item.date)} • Bal: {formatCurrency(item.balance)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
