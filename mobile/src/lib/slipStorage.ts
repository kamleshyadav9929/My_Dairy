import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MilkSlip {
  id: string; // Unique Entry ID or timestamp
  date: string; // DD/MM/YY
  time: string; // HH:MM
  shift: string; // 'Subah' / 'Sham'
  cattleType: string; // 'Bhains' / 'Gay'
  memberCode: string;
  memberName: string; // 'JITU'
  weight: string; // '04.4 M'
  fat: string; // '06.5M'
  rate: string; // '61.55'
  amount: string; // '0270.82'
  dairyName: string; // '35 - RAMPUR A9929394623'
}

const SLIPS_KEY = 'dairy_milk_slips';

export const SlipStorage = {
  /**
   * Add a new slip to the top of the list
   */
  saveSlip: async (slip: MilkSlip) => {
    try {
      const existing = await SlipStorage.getSlips();
      // Avoid duplicates based on ID
      if (existing.some(s => s.id === slip.id)) return;
      
      const updated = [slip, ...existing];
      await AsyncStorage.setItem(SLIPS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save slip:', error);
    }
  },

  /**
   * Get all saved slips
   */
  getSlips: async (): Promise<MilkSlip[]> => {
    try {
      const json = await AsyncStorage.getItem(SLIPS_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Failed to fetch slips:', error);
      return [];
    }
  },

  /**
   * Clear all slips (debugging/reset)
   */
  clearSlips: async () => {
    try {
      await AsyncStorage.removeItem(SLIPS_KEY);
    } catch (error) {
      console.error('Failed to clear slips:', error);
    }
  }
};
