import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function ThemeSelector({ visible, onClose }: ThemeSelectorProps) {
  const { themeMode, changeTheme } = useTheme();
  const { t } = useI18n();

  const handleSelect = async (mode: ThemeMode) => {
    await changeTheme(mode);
    onClose();
  };

  const themes = [
    { code: 'light' as ThemeMode, name: t('light'), icon: 'sunny-outline' as const },
    { code: 'dark' as ThemeMode, name: t('dark'), icon: 'moon-outline' as const },
    { code: 'system' as ThemeMode, name: t('system'), icon: 'phone-portrait-outline' as const },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable 
          style={{ 
            backgroundColor: '#ffffff', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24,
            paddingBottom: 40
          }}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#e5e5e5', borderRadius: 2 }} />
          </View>

          {/* Title */}
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#171717', textAlign: 'center', marginBottom: 20 }}>
            {t('select.theme')}
          </Text>

          {/* Options */}
          <View style={{ paddingHorizontal: 20 }}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.code}
                onPress={() => handleSelect(theme.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: themeMode === theme.code ? '#eef2ff' : '#fafafa',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: themeMode === theme.code ? '#4f46e5' : '#f5f5f5',
                }}
              >
                <View style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  backgroundColor: themeMode === theme.code ? '#4f46e5' : '#e5e5e5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16
                }}>
                  <Ionicons 
                    name={theme.icon} 
                    size={22} 
                    color={themeMode === theme.code ? '#ffffff' : '#525252'} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: themeMode === theme.code ? '#4f46e5' : '#171717' 
                  }}>
                    {theme.name}
                  </Text>
                </View>
                {themeMode === theme.code && (
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12, 
                    backgroundColor: '#4f46e5', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
