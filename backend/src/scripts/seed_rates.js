require('dotenv').config();
const { supabase } = require('../config/supabase');

async function seedRates() {
    try {
        console.log('--- Seeding Rate Cards (Cloud) ---');

        // 1. Clear existing rates
        const { error: deleteError } = await supabase
            .from('rate_cards')
            .delete()
            .neq('id', 0); // Delete all by valid condition

        if (deleteError) throw deleteError;
        console.log('Cleared existing rate cards.');

        // 2. Generate Rates
        const rates = [];

        // Cow Loop (0 - 10 Fat)
        for (let f = 0; f < 10; f += 0.5) {
            const minFat = f;
            const maxFat = f + 0.5;
            const avgFat = f + 0.25; 
            const rate = parseFloat((25 + (avgFat * 2.5)).toFixed(2));

            rates.push({
                milk_type: 'COW',
                min_fat: minFat,
                max_fat: maxFat,
                min_snf: 0,
                max_snf: 15,
                rate_per_litre: rate,
                is_active: true
            });
        }

        // Buffalo Loop (0 - 10 Fat)
        for (let f = 0; f < 10; f += 0.5) {
            const minFat = f;
            const maxFat = f + 0.5;
            const avgFat = f + 0.25;
            const rate = parseFloat((30 + (avgFat * 4.0)).toFixed(2));

            rates.push({
                milk_type: 'BUFFALO',
                min_fat: minFat,
                max_fat: maxFat,
                min_snf: 0,
                max_snf: 15,
                rate_per_litre: rate,
                is_active: true
            });
        }

        // Batch insert
        const { data, error: insertError } = await supabase
            .from('rate_cards')
            .insert(rates);

        if (insertError) throw insertError;

        console.log(`Successfully inserted ${rates.length} rate cards.`);
        
    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

seedRates();
