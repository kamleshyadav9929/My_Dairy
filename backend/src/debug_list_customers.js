require('dotenv').config();
const { supabase } = require('./config/supabase');

async function listCustomers() {
  console.log('--- Listing All Customers ---');

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, amcu_customer_id, name, phone');

  if (error) {
    console.error('Error fetching customers:', error);
    return;
  }

  if (!customers || customers.length === 0) {
    console.log('No customers found in database.');
    return;
  }

  console.log(`Found ${customers.length} customers:`);
  customers.forEach(c => {
    console.log(`ID: ${c.id} | AMCU ID: ${c.amcu_customer_id} | Name: ${c.name} | Phone: ${c.phone}`);
  });
}

listCustomers();
