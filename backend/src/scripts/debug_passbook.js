require('dotenv').config();
const { supabase } = require('../config/supabase');

async function debugPassbook() {
    console.log('Finding customer 1006...');
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('amcu_customer_id', '1006')
        .single();
    
    if (customerError) {
        console.error('Error finding customer:', customerError);
        return;
    }

    if (!customer) {
        console.error('Customer 1006 not found');
        return;
    }

    console.log('Customer found:', customer.id, customer.name);

    console.log('Checking milk entries...');
    const { data: entries, error: entriesError } = await supabase
        .from('milk_entries')
        .select('*')
        .eq('customer_id', customer.id);

    if (entriesError) {
        console.error('Error fetching entries:', entriesError);
    } else {
        console.log(`Found ${entries.length} entries.`);
        if (entries.length > 0) {
            console.log('Sample entry:', entries[0]);
        }
    }

     console.log('Checking payments...');
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id);

    if (paymentsError) {
         console.error('Error fetching payments:', paymentsError);
    } else {
        console.log(`Found ${payments.length} payments.`);
    }
}

debugPassbook();
