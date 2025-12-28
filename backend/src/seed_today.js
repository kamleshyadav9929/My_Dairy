require('dotenv').config();
const { supabase, getLocalDate } = require('./config/supabase');

async function seedToday() {
  const today = getLocalDate();
  console.log(`Seeding data for ${today}...`);

  // Get Suresh (1002)
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('amcu_customer_id', '1002')
    .single();

  if (!customer) {
    console.error('Customer 1002 not found!');
    return;
  }

  const entries = [
    {
      customer_id: customer.id,
      date: today,
      shift: 'M',
      quantity_litre: 5.5,
      fat: 4.2,
      snf: 8.5,
      rate_per_litre: 45.0,
      amount: 247.5,
      milk_type: 'COW'
    },
    {
      customer_id: customer.id,
      date: today,
      shift: 'E',
      quantity_litre: 4.0,
      fat: 4.5,
      snf: 8.7,
      rate_per_litre: 48.0,
      amount: 192.0,
      milk_type: 'COW'
    }
  ];

  const { data, error } = await supabase
    .from('milk_entries')
    .insert(entries)
    .select();

  if (error) {
    console.error('Error seeding data:', error);
  } else {
    console.log('Successfully seeded 2 entries:', data);
  }
}

seedToday();
