import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Share, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { generatePassbookPDF } from '../lib/pdfUtils';
import { PassbookSkeleton } from '../components/Skeleton';
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
  const { t } = useI18n();
  const { colors, isDark } = useTheme();
  const [downloading, setDownloading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'milk' | 'payment'>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['passbook', user?.id],
    queryFn: async () => {
      const res = await customerPortalApi.getPassbook({ 
        from: '2020-01-01', 
        to: new Date().toISOString().split('T')[0] 
      });
      return res.data;
    },
    enabled: !!user,
  });

  const transactions = useMemo(() => data?.transactions || [], [data]);
  const summary = data?.summary || {};

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t: PassbookEntry) => t.type.toLowerCase() === filter);
  }, [transactions, filter]);

  const list = useMemo(() => [...filtered].reverse(), [filtered]);

  const formatCurrency = (val: number) => '₹' + Math.abs(val || 0).toLocaleString('en-IN');

  const handleDownload = async () => {
    if (!transactions.length || !summary || !user) return;
    setDownloading(true);
    try {
      await generatePassbookPDF({
        customer: { name: user.name || 'Customer', amcuId: user.amcuId || '-' },
        entries: transactions.map((t: PassbookEntry) => ({
          date: new Date(t.date).toLocaleDateString('en-IN'),
          type: t.type.toLowerCase(),
          description: t.description || (t.type === 'MILK' ? 'Milk Collection' : 'Payment'),
          debit: t.debit || 0, credit: t.credit || 0, balance: t.balance || 0
        })),
        summary: { totalLitres: summary.totalLitres || 0, totalAmount: summary.totalAmount || 0, totalPayments: summary.totalPayments || 0, balance: summary.balance || 0 },
        period: { from: 'All Time', to: new Date().toLocaleDateString('en-IN') }
      });
    } catch { Alert.alert('Error', 'Failed to generate PDF.'); }
    finally { setDownloading(false); }
  };

  const renderHeader = useCallback(() => (
    <View>
      {/* Balance Card */}
      <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="wallet-outline" size={16} color={colors.textSecondary} />
          <Text style={{ marginLeft: 8, color: colors.textSecondary, fontSize: 12, fontWeight: '500' }}>{t('current.balance')}</Text>
        </View>
        
        <Text style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>{formatCurrency(summary?.balance)}</Text>
        
        <View style={{ flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, letterSpacing: 1 }}>{t('earned').toUpperCase()}</Text>
            <Text style={{ color: colors.success, fontSize: 14, fontWeight: '600', marginTop: 4 }}>+{formatCurrency(summary?.totalMilkAmount || 0)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 10, letterSpacing: 1 }}>{t('received').toUpperCase()}</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 }}>-{formatCurrency(summary?.totalPayments || 0)}</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 16, flexDirection: 'row', backgroundColor: colors.card, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
        {[
          { key: 'all', label: t('all') },
          { key: 'milk', label: t('milk') },
          { key: 'payment', label: t('payments') },
        ].map((f) => (
          <TouchableOpacity 
            key={f.key} 
            onPress={() => setFilter(f.key as any)}
            style={{ 
              flex: 1, 
              paddingVertical: 10, 
              alignItems: 'center', 
              borderRadius: 8,
              backgroundColor: filter === f.key ? (isDark ? colors.primary : '#ffffff') : 'transparent',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: filter === f.key ? (isDark ? '#ffffff' : colors.text) : colors.textSecondary }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [colors, summary, filter, t, isDark]);

  const renderItem = useCallback(({ item, index }: { item: PassbookEntry, index: number }) => {
    const isMilk = item.type.toLowerCase() === 'milk';
    return (
      <View 
        style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingVertical: 16, 
          paddingHorizontal: 20,
          borderTopWidth: index !== 0 ? 1 : 0, 
          borderTopColor: colors.border 
        }}
      >
        <View 
          style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 20, 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: isMilk ? '#e0e7ff' : '#ecfdf5' 
          }}
        >
          <Ionicons name={isMilk ? 'water-outline' : 'card-outline'} size={18} color={isMilk ? '#4f46e5' : '#10b981'} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '500', fontSize: 14 }}>{isMilk ? t('milk.collection') : t('payment.received')}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            {isMilk && item.details && ` · ${item.details.quantity_litre || item.details.qty}L`}
          </Text>
        </View>
        <Text style={{ fontWeight: '600', color: item.credit > 0 ? colors.success : colors.text }}>
          {item.credit > 0 ? '+' : ''}{formatCurrency(item.credit > 0 ? item.credit : -item.debit)}
        </Text>
      </View>
    );
  }, [colors, t]);

  const emptyComponent = useCallback(() => (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <Ionicons name="document-outline" size={40} color={colors.textSecondary} />
      <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '500' }}>{t('no.transactions')}</Text>
    </View>
  ), [colors, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      
      {/* Header Bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>{t('passbook.title')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              onPress={() => Share.share({ message: `Balance: ${formatCurrency(summary?.balance)}` })}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDownload}
              disabled={downloading}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' }}
            >
              {downloading ? <ActivityIndicator size="small" color={colors.background} /> : <Ionicons name="download-outline" size={16} color={colors.background} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <PassbookSkeleton />
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={list}
            renderItem={renderItem}
            estimatedItemSize={72}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={emptyComponent}
            contentContainerStyle={{ paddingBottom: 100 }}
            onRefresh={refetch}
            refreshing={isRefetching}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
