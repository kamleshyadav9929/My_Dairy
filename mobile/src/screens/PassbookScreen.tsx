import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Alert, Share, StatusBar } from 'react-native';
import { customerPortalApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { generatePassbookPDF } from '../lib/pdfUtils';
import { Ionicons } from '@expo/vector-icons';

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
  const [filter, setFilter] = useState<'all' | 'milk' | 'payment'>('all');

  const loadData = async () => {
    try {
      const res = await customerPortalApi.getPassbook({ from: '2020-01-01', to: new Date().toISOString().split('T')[0] });
      setTransactions(res.data.transactions || []);
      setSummary(res.data.summary || {});
    } catch (error: any) {
      console.error('Passbook error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type.toLowerCase() === filter);
  }, [transactions, filter]);

  const list = useMemo(() => [...filtered].reverse(), [filtered]);

  const formatCurrency = (val: number) => '₹' + Math.abs(val || 0).toLocaleString('en-IN');

  const handleDownload = async () => {
    if (!transactions.length || !summary || !user) return;
    setDownloading(true);
    try {
      await generatePassbookPDF({
        customer: { name: user.name || 'Customer', amcuId: user.amcuId || '-' },
        entries: transactions.map(t => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          type: t.type.toLowerCase(),
          description: t.description || (t.type === 'MILK' ? 'Milk Collection' : 'Payment'),
          debit: t.debit || 0, credit: t.credit || 0, balance: t.balance || 0
        })),
        summary: { totalLitres: summary.totalLitres || 0, totalAmount: summary.totalMilkAmount || 0, totalPayments: summary.totalPayments || 0, balance: summary.balance || 0 },
        period: { from: 'All Time', to: new Date().toLocaleDateString('en-IN') }
      });
    } catch { Alert.alert('Error', 'Failed to generate PDF.'); }
    finally { setDownloading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="px-5 pt-4 pb-4 border-b border-neutral-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-neutral-900 text-xl font-semibold">Passbook</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => Share.share({ message: `Balance: ${formatCurrency(summary?.balance)}` })}
              className="w-9 h-9 rounded-full bg-neutral-100 items-center justify-center"
            >
              <Ionicons name="share-outline" size={16} color="#525252" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDownload}
              disabled={downloading}
              className="w-9 h-9 rounded-full bg-neutral-900 items-center justify-center"
            >
              {downloading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="download-outline" size={16} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {/* Balance Card */}
        <View className="mx-5 mt-4 bg-neutral-900 rounded-2xl p-5">
          <Text className="text-white/50 text-[10px] tracking-widest mb-1">CURRENT BALANCE</Text>
          <Text className="text-white text-3xl font-bold">{formatCurrency(summary?.balance)}</Text>
          
          <View className="flex-row mt-4 pt-4 border-t border-white/10">
            <View className="flex-1">
              <Text className="text-white/40 text-[9px] tracking-wide">EARNED</Text>
              <Text className="text-emerald-400 text-sm font-semibold mt-0.5">+{formatCurrency(summary?.totalMilkAmount || 0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/40 text-[9px] tracking-wide">RECEIVED</Text>
              <Text className="text-white text-sm font-semibold mt-0.5">-{formatCurrency(summary?.totalPayments || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View className="mx-5 mt-4 flex-row bg-neutral-100 p-1 rounded-xl">
          {[
            { key: 'all', label: 'All' },
            { key: 'milk', label: 'Milk' },
            { key: 'payment', label: 'Payments' },
          ].map((f) => (
            <TouchableOpacity 
              key={f.key} 
              onPress={() => setFilter(f.key as any)}
              className={`flex-1 py-2.5 items-center rounded-lg ${filter === f.key ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-medium ${filter === f.key ? 'text-neutral-900' : 'text-neutral-500'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions */}
        <View className="px-5 mt-4 pb-24">
          {loading ? (
            <ActivityIndicator size="large" color="#171717" className="mt-10" />
          ) : list.length === 0 ? (
            <View className="items-center py-16">
              <Ionicons name="document-outline" size={40} color="#d4d4d4" />
              <Text className="text-neutral-400 mt-3 font-medium">No transactions</Text>
            </View>
          ) : (
            list.map((item, idx) => {
              const isMilk = item.type.toLowerCase() === 'milk';
              return (
                <View key={item.id} className={`flex-row items-center py-4 ${idx !== 0 ? 'border-t border-neutral-100' : ''}`}>
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${isMilk ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                    <Ionicons name={isMilk ? 'water-outline' : 'card-outline'} size={18} color={isMilk ? '#4f46e5' : '#10b981'} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-neutral-900 font-medium text-sm">{isMilk ? 'Milk Collection' : 'Payment'}</Text>
                    <Text className="text-neutral-400 text-xs mt-0.5">
                      {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {isMilk && item.details && ` · ${item.details.quantity_litre}L`}
                    </Text>
                  </View>
                  <Text className={`font-semibold ${item.credit > 0 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                    {item.credit > 0 ? '+' : ''}{formatCurrency(item.credit > 0 ? item.credit : -item.debit)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
