import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Alert, Share, StatusBar, Dimensions } from 'react-native';
import { customerPortalApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { generatePassbookPDF } from '../lib/pdfUtils';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
      const fromDate = currentMonth 
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0] 
        : '2020-01-01';
      const toDate = currentMonth 
        ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      const res = await customerPortalApi.getPassbook({ from: fromDate, to: toDate });
      setTransactions(res.data.transactions || []);
      setSummary(res.data.summary || {});
    } catch (error: any) {
      console.error('Passbook error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [currentMonth]);

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
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const handleShare = async () => {
    if (!summary) return;
    await Share.share({ message: `💰 My Dairy Balance: ${formatCurrency(summary.balance)}` });
  };
  
  const handleDownload = async () => {
    if (!transactions.length || !summary || !user) {
      Alert.alert('No Data', 'No transactions to export.');
      return;
    }
    setDownloading(true);
    try {
      await generatePassbookPDF({
        customer: { name: user.name || 'Customer', amcuId: user.amcuId || user.id?.toString() || '-' },
        entries: transactions.map(t => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          type: t.type.toLowerCase(),
          description: t.description || (t.type === 'MILK' ? 'Milk Collection' : 'Payment'),
          debit: t.debit || 0, credit: t.credit || 0, balance: t.balance || 0
        })),
        summary: {
          totalLitres: summary.totalLitres || 0,
          totalAmount: summary.totalMilkAmount || 0,
          totalPayments: summary.totalPayments || 0,
          balance: summary.balance || 0
        },
        period: { from: currentMonth?.toLocaleDateString('en-IN') || 'All Time', to: new Date().toLocaleDateString('en-IN') }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const milkCount = transactions.filter(t => t.type.toLowerCase() === 'milk').length;
  const paymentCount = transactions.filter(t => t.type.toLowerCase() === 'payment').length;

  return (
    <View className="flex-1 bg-[#0a0a0f]">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      
      {/* Ambient Effects */}
      <View className="absolute top-20 left-0 w-72 h-72 rounded-full opacity-20" style={{ backgroundColor: '#10b981', transform: [{ translateX: -100 }] }} />
      <View className="absolute top-60 right-0 w-64 h-64 rounded-full opacity-15" style={{ backgroundColor: '#6366f1', transform: [{ translateX: 80 }] }} />
      
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-white/40 text-sm font-medium">💳 Passbook</Text>
        </View>

        {/* Balance Card */}
        <View className="mx-6 rounded-3xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <BlurView intensity={25} tint="dark" className="p-6">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-white/40 text-xs uppercase tracking-widest">Current Balance</Text>
                <Text className="text-white text-4xl font-bold mt-1">{formatCurrency(summary?.balance)}</Text>
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity 
                  onPress={handleShare}
                  className="w-11 h-11 rounded-xl bg-white/10 items-center justify-center border border-white/5"
                >
                  <Text className="text-lg">📤</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDownload}
                  disabled={downloading}
                  className="w-11 h-11 rounded-xl bg-indigo-500/80 items-center justify-center"
                >
                  {downloading ? <ActivityIndicator size="small" color="white" /> : <Text className="text-lg">📄</Text>}
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row gap-3 mt-2">
              <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                <Text className="text-emerald-400/80 text-xs">↗ Earned</Text>
                <Text className="text-white font-bold mt-1">{formatCurrency(summary?.totalMilkAmount || 0)}</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                <Text className="text-cyan-400/80 text-xs">↙ Received</Text>
                <Text className="text-white font-bold mt-1">{formatCurrency(summary?.totalPayments || 0)}</Text>
              </View>
            </View>
          </BlurView>
        </View>

        <ScrollView 
          className="flex-1 mt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          {/* Month Selector */}
          <View className="mx-6 mb-4">
            <View className="flex-row items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5">
              <TouchableOpacity 
                onPress={() => setCurrentMonth(prev => {
                  if (!prev) return new Date();
                  const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d;
                })}
                className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              
              <Text className="text-white font-bold">
                {currentMonth ? currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '📆 All Time'}
              </Text>
              
              <View className="flex-row items-center gap-2">
                <TouchableOpacity 
                  onPress={() => setCurrentMonth(prev => {
                    if (!prev) return null;
                    const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d;
                  })}
                  className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center"
                >
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View className="mx-6 mb-4 flex-row bg-white/5 p-1.5 rounded-2xl border border-white/5">
            {[
              { key: 'all', label: '🔄 All', count: transactions.length },
              { key: 'milk', label: '🥛 Milk', count: milkCount },
              { key: 'payment', label: '💵 Payments', count: paymentCount }
            ].map((f) => (
              <TouchableOpacity 
                key={f.key} 
                onPress={() => setTransactionFilter(f.key as any)}
                className={`flex-1 py-3 items-center rounded-xl ${transactionFilter === f.key ? 'bg-white/10' : ''}`}
              >
                <Text className={`text-xs font-bold ${transactionFilter === f.key ? 'text-white' : 'text-white/40'}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transactions */}
          <View className="px-6 pb-28">
            {loading ? (
              <ActivityIndicator size="large" color="#6366f1" className="mt-10" />
            ) : reversedList.length === 0 ? (
              <View className="items-center py-16">
                <Text className="text-5xl mb-4">📭</Text>
                <Text className="text-white/40 font-medium">No transactions found</Text>
              </View>
            ) : (
              reversedList.map((item, idx) => {
                const isMilk = item.type.toLowerCase() === 'milk';
                return (
                  <View 
                    key={item.id} 
                    className="flex-row justify-between items-center py-4 border-b border-white/5"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isMilk ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
                        <Text className="text-xl">{isMilk ? '🥛' : '💰'}</Text>
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-white font-bold text-sm">
                          {isMilk ? 'Milk Collection' : 'Payment Received'}
                        </Text>
                        <Text className="text-white/30 text-xs mt-0.5">
                          {isMilk && item.details 
                            ? `${item.details.shift === 'M' ? '🌅' : '🌆'} ${item.details.quantity_litre}L`
                            : item.description}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className={`font-bold text-base ${item.credit > 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {item.credit > 0 ? '+' : ''}{item.credit > 0 ? formatCurrency(item.credit) : formatCurrency(-item.debit)}
                      </Text>
                      <Text className="text-white/20 text-[10px] mt-0.5">{getDayMonth(item.date)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
