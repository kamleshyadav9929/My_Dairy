require('dotenv').config();
const { supabase, getLocalDate } = require('./config/supabase');

async function debugData() {
    console.log('--- Debugging Data for Ramesh Kumar ---');
    const today = getLocalDate();

    // 1. Get Ramesh Kumar
    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('amcu_customer_id', '1002')
        .single();

    if (!customer) {
        console.log("Customer 1001 not found");
        return;
    }

    console.log(`Checking entries for ${customer.name} (ID: ${customer.id}) on ${today}`);

    // 2. Get entries
    const { data: entries } = await supabase
        .from('milk_entries')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('date', today);

    console.log(`Found ${entries?.length || 0} entries:`);
    entries?.forEach((e, i) => {
        console.log(`[${i + 1}] Qty: ${e.quantity_litre}, Fat: ${e.fat}, SNF: ${e.snf}, Amount: ${e.amount}, Shift: ${e.shift}, Created: ${e.created_at}`);
    });
}

debugData();
