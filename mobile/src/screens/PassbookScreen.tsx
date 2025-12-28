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

  const handleFilterChange = (newFilter: 'all' | 'milk' | 'payment') => {
    setFilter(newFilter);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#171717', fontSize: 20, fontWeight: '600' }}>Passbook</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              onPress={() => Share.share({ message: `Balance: ${formatCurrency(summary?.balance)}` })}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="share-outline" size={16} color="#525252" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDownload}
              disabled={downloading}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }}
            >
              {downloading ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="download-outline" size={16} color="white" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {/* Balance Card - Light style like Dashboard */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: '#fafafa', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f5f5f5' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="wallet-outline" size={16} color="#737373" />
            <Text style={{ marginLeft: 8, color: '#737373', fontSize: 12, fontWeight: '500' }}>Current Balance</Text>
          </View>
          
          <Text style={{ color: '#171717', fontSize: 30, fontWeight: '700' }}>{formatCurrency(summary?.balance)}</Text>
          
          <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e5e5' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#a3a3a3', fontSize: 10, letterSpacing: 1 }}>EARNED</Text>
              <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '600', marginTop: 4 }}>+{formatCurrency(summary?.totalMilkAmount || 0)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#e5e5e5' }} />
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={{ color: '#a3a3a3', fontSize: 10, letterSpacing: 1 }}>RECEIVED</Text>
              <Text style={{ color: '#171717', fontSize: 14, fontWeight: '600', marginTop: 4 }}>-{formatCurrency(summary?.totalPayments || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: 'row', backgroundColor: '#f5f5f5', padding: 4, borderRadius: 12 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'milk', label: 'Milk' },
            { key: 'payment', label: 'Payments' },
          ].map((f) => (
            <TouchableOpacity 
              key={f.key} 
              onPress={() => handleFilterChange(f.key as any)}
              style={{ 
                flex: 1, 
                paddingVertical: 10, 
                alignItems: 'center', 
                borderRadius: 8,
                backgroundColor: filter === f.key ? '#ffffff' : 'transparent',
                shadowColor: filter === f.key ? '#000' : 'transparent',
                shadowOpacity: filter === f.key ? 0.05 : 0,
                shadowRadius: 2,
                elevation: filter === f.key ? 1 : 0,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: filter === f.key ? '#171717' : '#737373' }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions */}
        <View style={{ paddingHorizontal: 20, marginTop: 16, paddingBottom: 100 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#171717" style={{ marginTop: 40 }} />
          ) : list.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Ionicons name="document-outline" size={40} color="#d4d4d4" />
              <Text style={{ color: '#a3a3a3', marginTop: 12, fontWeight: '500' }}>No transactions</Text>
            </View>
          ) : (
            list.map((item, idx) => {
              const isMilk = item.type.toLowerCase() === 'milk';
              return (
                <View 
                  key={item.id} 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingVertical: 16, 
                    borderTopWidth: idx !== 0 ? 1 : 0, 
                    borderTopColor: '#f5f5f5' 
                  }}
                >
                  <View 
                    style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 20, 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      backgroundColor: isMilk ? '#eef2ff' : '#ecfdf5' 
                    }}
                  >
                    <Ionicons name={isMilk ? 'water-outline' : 'card-outline'} size={18} color={isMilk ? '#4f46e5' : '#10b981'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#171717', fontWeight: '500', fontSize: 14 }}>{isMilk ? 'Milk Collection' : 'Payment'}</Text>
                    <Text style={{ color: '#a3a3a3', fontSize: 12, marginTop: 2 }}>
                      {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {isMilk && item.details && ` · ${item.details.quantity_litre || item.details.qty}L`}
                    </Text>
                  </View>
                  <Text style={{ fontWeight: '600', color: item.credit > 0 ? '#10b981' : '#171717' }}>
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
