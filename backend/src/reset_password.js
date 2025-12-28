require('dotenv').config();
const { supabase } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  console.log('--- Resetting Password for Customer 1002 ---');

  const hashedPassword = bcrypt.hashSync('1234', 10);

  const { data, error } = await supabase
    .from('customers')
    .update({ password_hash: hashedPassword })
    .eq('amcu_customer_id', '1002')
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Password reset for ${data.name} to '1234'`);
}

resetPassword();
