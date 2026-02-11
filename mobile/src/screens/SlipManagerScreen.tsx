import React, { useState, useCallback } from 'react';
import { View, Text, StatusBar, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { SlipCard } from '../components/SlipCard';
import { SlipStorage, MilkSlip } from '../lib/slipStorage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DairyFileSystem } from '../lib/fileSystem';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

export default function SlipManagerScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const [slips, setSlips] = useState<MilkSlip[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSlips();
    }, [])
  );

  const loadSlips = async () => {
    const data = await SlipStorage.getSlips();
    setSlips(data);
  };

  const handleSaveSlip = async (slip: MilkSlip) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'File system saving is currently Android only.');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Generate HTML for PDF
      const html = `
        <html>
          <body style="font-family: monospace; text-align: center; padding: 20px;">
            <h3>${slip.dairyName}</h3>
            <p>दुग्ध उत्पादक सहकारी समिति</p>
            <br/>
            <p>Date: ${slip.date}  Time: ${slip.time}</p>
            <p>Shift: ${slip.shift}</p>
            <p>Cattle: ${slip.cattleType}</p>
            <p>Member: ${slip.memberCode} - ${slip.memberName}</p>
            <hr/>
            <p>Weight: ${slip.weight}</p>
            <p>Fat: ${slip.fat}</p>
            <p>Rate: ${slip.rate}</p>
            <h2>Amount: ${slip.amount}</h2>
            <hr/>
          </body>
        </html>
      `;

      // 2. Generate PDF file
      const { uri } = await Print.printToFileAsync({ html, base64: true });

      // 3. Save to "MyDairy" folder
      // Read file content as base64 (using string 'base64' to avoid enum issues)
      const pdfContent = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const filename = `Slip_${slip.date.replace(/\//g, '-')}_${slip.shift}_${slip.id}.pdf`;

      const success = await DairyFileSystem.saveFile(filename, pdfContent, 'application/pdf');

      if (success) {
        Alert.alert('Saved', 'Slip saved to MyDairy folder.');
      }

    } catch (error) {
      console.error('Save slip error:', error);
      Alert.alert('Error', 'Failed to save slip.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: MilkSlip }) => {
    return (
      <View style={{ width: width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        {/* Date and Time Header above slip */}
        <View style={{ marginBottom: 10, alignItems: 'center' }}>
          <Text style={{ color: '#a3a3a3', fontSize: 14, fontWeight: '600' }}>
             {item.date} • {item.time} {item.shift === 'Subah' ? 'AM' : 'PM'}
          </Text>
        </View>

        <SlipCard data={item} onSave={() => handleSaveSlip(item)} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#333333' }}>
      <StatusBar barStyle="light-content" backgroundColor="#333333" />
      
      {/* Header */}
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>Digital Slip Manager</Text>
        <Text style={{ color: '#a3a3a3', fontSize: 12 }}>Swipe left/right to view history</Text>
      </View>

      {/* List */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {slips.length === 0 ? (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="documents-outline" size={48} color="#737373" />
            <Text style={{ color: '#a3a3a3', marginTop: 16 }}>No slips generated yet.</Text>
          </View>
        ) : (
          <FlashList
            data={slips}
            renderItem={renderItem}
            estimatedItemSize={width} // 'width' is a number from Dimensions.get()
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
