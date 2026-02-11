import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SlipCardProps {
  data: {
    dairyName: string; 
    date: string;
    time: string;
    shift: string;
    cattleType: string;
    memberCode: string;
    memberName: string;
    weight: string;
    fat: string;
    rate: string;
    amount: string;
  };
  onSave?: () => void;
}

export function SlipCard({ data, onSave }: SlipCardProps) {
  return (
    <View style={styles.card}>
      {/* Save Button (Absolute positioned at top right) */}
      {onSave && (
        <TouchableOpacity onPress={onSave} style={styles.saveButton}>
           <Ionicons name="download-outline" size={20} color="#333" />
        </TouchableOpacity>
      )}

      {/* Paper texture effect (background color) */}
      <View style={styles.content}>
        
        {/* Header */}
        <Text style={[styles.text, styles.header]}>{data.dairyName}</Text>
        <Text style={[styles.text, styles.subHeader]}>दुग्ध उत्पादक सहकारी समिति</Text>

        {/* Date / Time */}
        <View style={styles.row}>
          <Text style={styles.text}>दिनांक :</Text>
          <Text style={styles.text}> {data.date}  {data.time}</Text>
        </View>

        {/* Shift */}
        <View style={styles.row}>
          <Text style={styles.text}>शिफ्ट :</Text>
          <Text style={styles.text}> {data.shift}</Text>
        </View>

        {/* Cattle Type */}
        <View style={styles.row}>
          <Text style={styles.text}>पशु प्रकार :</Text>
          <Text style={styles.text}> {data.cattleType}</Text>
        </View>

        {/* Member Code */}
        <View style={styles.row}>
          <Text style={styles.text}>सदस्य कोड :</Text>
          <Text style={styles.text}> {data.memberCode}</Text>
        </View>

        {/* Member Name (Left aligned usually, but here in flow) */}
        <Text style={[styles.text, styles.memberName]}>{data.memberName}</Text>

        {/* Details Table */}
        <View style={styles.detailRow}>
          <Text style={styles.text}>वजन (ली.):</Text>
          <Text style={styles.text}>{data.weight}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.text}>फैट (%):</Text>
          <Text style={styles.text}>{data.fat}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.text}>भाव (रु. / ली.):</Text>
          <Text style={styles.text}>{data.rate}</Text>
        </View>

        <View style={[styles.detailRow, { marginTop: 8 }]}>
          <Text style={[styles.text, styles.amountLabel]}>राशि (रु.):</Text>
          <Text style={[styles.text, styles.amountValue]}>{data.amount}</Text>
        </View>

      </View>
      
      {/* Zigzag bottom (simulated with dashed border or similar, simple border here) */}
      <View style={styles.zigzag} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f5f5f4', // Off-white/Receipt paper color
    width: 320,
    alignSelf: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20, // Space for shadow
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontFamily: 'monospace', // Trying to match dot matrix
    color: '#333333', // Faded black/grey ink
    fontSize: 16,
    marginBottom: 4,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align labels left
    width: '100%',
    marginBottom: 4,
  },
  memberName: {
    width: '100%',
    textAlign: 'left',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
    paddingHorizontal: 10, // Indent values slightly like image
  },
  amountLabel: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  amountValue: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  zigzag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 1, // Simple Line for now to mark end
    borderBottomColor: '#d4d4d4',
    borderStyle: 'dashed'
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 10,
  }
});
