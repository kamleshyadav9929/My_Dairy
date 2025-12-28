require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkCustomer() {
  console.log('--- Checking Customer 1002 Details ---');

  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, amcu_customer_id, name, phone, password_hash, is_active')
    .eq('amcu_customer_id', '1002')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Customer found:');
  console.log(`  ID: ${customer.id}`);
  console.log(`  Name: ${customer.name}`);
  console.log(`  Phone: ${customer.phone}`);
  console.log(`  Is Active: ${customer.is_active}`);
  console.log(`  Has Password: ${customer.password_hash ? 'Yes' : 'No (uses default 1234)'}`);
}

checkCustomer();
