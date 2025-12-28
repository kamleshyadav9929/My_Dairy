import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n, Language } from '../context/I18nContext';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { language, changeLanguage, t } = useI18n();

  const handleSelect = async (lang: Language) => {
    await changeLanguage(lang);
    onClose();
  };

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
    { code: 'hi' as Language, name: 'हिंदी', flag: '🇮🇳' },
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
            {t('select.language')}
          </Text>

          {/* Options */}
          <View style={{ paddingHorizontal: 20 }}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: language === lang.code ? '#eef2ff' : '#fafafa',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: language === lang.code ? '#4f46e5' : '#f5f5f5',
                }}
              >
                <Text style={{ fontSize: 28, marginRight: 16 }}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    color: language === lang.code ? '#4f46e5' : '#171717' 
                  }}>
                    {lang.name}
                  </Text>
                </View>
                {language === lang.code && (
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
