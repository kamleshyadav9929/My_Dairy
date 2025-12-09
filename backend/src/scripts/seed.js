require('dotenv').config();

const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('Starting Supabase seed...\n');

    try {
        // Check if admin exists
        const { data: existingAdmin } = await supabase
            .from('users')
            .select('id')
            .eq('username', process.env.ADMIN_DEFAULT_USER || 'admin')
            .single();

        if (!existingAdmin) {
            // Create default admin user
            const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASS || 'admin123', 10);
            
            const { error: adminError } = await supabase
                .from('users')
                .insert({
                    role: 'admin',
                    username: process.env.ADMIN_DEFAULT_USER || 'admin',
                    name: 'Administrator',
                    password_hash: adminPasswordHash
                });

            if (adminError) throw adminError;
            console.log('Created default admin user');
            console.log('  Username:', process.env.ADMIN_DEFAULT_USER || 'admin');
            console.log('  Password:', process.env.ADMIN_DEFAULT_PASS || 'admin123');
        } else {
            console.log('Admin user already exists');
        }

        // Check if sample customers exist
        const { data: existingCustomers } = await supabase
            .from('customers')
            .select('id')
            .limit(1);

        if (!existingCustomers || existingCustomers.length === 0) {
            const sampleCustomers = [
                { amcu_customer_id: '1001', name: 'Ramesh Kumar', phone: '9876543210', milk_type_default: 'COW' },
                { amcu_customer_id: '1002', name: 'Suresh Yadav', phone: '9876543211', milk_type_default: 'BUFFALO' },
                { amcu_customer_id: '1003', name: 'Mahesh Singh', phone: '9876543212', milk_type_default: 'COW' },
                { amcu_customer_id: '1004', name: 'Dinesh Gupta', phone: '9876543213', milk_type_default: 'MIXED' },
                { amcu_customer_id: '1005', name: 'Rajesh Verma', phone: '9876543214', milk_type_default: 'BUFFALO' },
            ];

            // Default password for all customers: 'customer123'
            const customerPasswordHash = bcrypt.hashSync('customer123', 10);

            for (const customer of sampleCustomers) {
                const { error } = await supabase
                    .from('customers')
                    .insert({
                        ...customer,
                        password_hash: customerPasswordHash
                    });

                if (error && !error.message.includes('duplicate')) {
                    console.error(`Error creating customer ${customer.name}:`, error.message);
                }
            }

            console.log(`\nCreated ${sampleCustomers.length} sample customers`);
            console.log('  Default customer password: customer123');
        } else {
            console.log('Sample customers already exist');
        }

        console.log('\nSeed completed successfully!');
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

// Run seed if called directly
if (require.main === module) {
    seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
