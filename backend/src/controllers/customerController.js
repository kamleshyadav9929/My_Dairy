const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

/**
 * Get all customers with pagination and computed stats
 */
async function getAllCustomers(req, res) {
    try {
        const { search, page = 1, limit = 20, active } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' });

        if (search) {
            query = query.or(`name.ilike.%${search}%,amcu_customer_id.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        if (active !== undefined) {
            query = query.eq('is_active', active === 'true');
        }

        query = query
            .order('name')
            .range(offset, offset + parseInt(limit) - 1);

        const { data: customers, count, error } = await query;

        if (error) throw error;

        // Compute stats for each customer
        const customersWithStats = await Promise.all(customers.map(async (customer) => {
            // Get total milk entries
            const { data: entries } = await supabase
                .from('milk_entries')
                .select('quantity_litre, amount')
                .eq('customer_id', customer.id);

            // Get total payments
            const { data: payments } = await supabase
                .from('payments')
                .select('amount')
                .eq('customer_id', customer.id);

            // Get total advances
            const { data: advances } = await supabase
                .from('advances')
                .select('amount, utilized_amount')
                .eq('customer_id', customer.id)
                .eq('status', 'active');

            const totalMilkAmount = (entries || []).reduce((sum, e) => sum + (e.amount || 0), 0);
            const totalMilkLitres = (entries || []).reduce((sum, e) => sum + (e.quantity_litre || 0), 0);
            const totalPayments = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalAdvances = (advances || []).reduce((sum, a) => sum + (a.amount || 0) - (a.utilized_amount || 0), 0);

            return {
                ...customer,
                total_milk_amount: totalMilkLitres,
                total_milk_value: totalMilkAmount,
                total_payments: totalPayments,
                total_advances: totalAdvances,
                balance: totalMilkAmount - totalPayments - totalAdvances
            };
        }));

        res.json({
            customers: customersWithStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
}

/**
 * Get customer by ID
 */
async function getCustomerById(req, res) {
    try {
        const { id } = req.params;

        const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
}

/**
 * Get customer summary
 */
async function getCustomerSummary(req, res) {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        // Get entries
        let entriesQuery = supabase
            .from('milk_entries')
            .select('quantity_litre, amount')
            .eq('customer_id', id);

        if (from) entriesQuery = entriesQuery.gte('date', from);
        if (to) entriesQuery = entriesQuery.lte('date', to);

        const { data: entries, error: entriesError } = await entriesQuery;

        if (entriesError) throw entriesError;

        // Get payments
        let paymentsQuery = supabase
            .from('payments')
            .select('amount')
            .eq('customer_id', id);

        if (from) paymentsQuery = paymentsQuery.gte('date', from);
        if (to) paymentsQuery = paymentsQuery.lte('date', to);

        const { data: payments, error: paymentsError } = await paymentsQuery;

        if (paymentsError) throw paymentsError;

        // Get active advances
        const { data: advances, error: advancesError } = await supabase
            .from('advances')
            .select('amount, utilized_amount')
            .eq('customer_id', id)
            .eq('status', 'active');

        if (advancesError) throw advancesError;

        const totalMilkAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalAdvances = (advances || []).reduce((sum, a) => sum + (a.amount || 0) - (a.utilized_amount || 0), 0);

        res.json({
            totalLitres: entries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0),
            totalMilkAmount,
            totalPayments,
            totalAdvances,
            balance: totalMilkAmount - totalPayments - totalAdvances,
            entryCount: entries.length,
            paymentCount: payments.length,
            advanceCount: (advances || []).length
        });
    } catch (error) {
        console.error('Customer summary error:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
}

/**
 * Get customer passbook
 */
async function getCustomerPassbook(req, res) {
    try {
        const { id } = req.params;
        const { from, to } = req.query;

        console.log('Passbook request:', { id, from, to });

        // Get entries
        // Including fat and snf
        let entriesQuery = supabase
            .from('milk_entries')
            .select('id, date, shift, quantity_litre, rate_per_litre, amount, fat, snf')
            .eq('customer_id', id);

        if (from) entriesQuery = entriesQuery.gte('date', from);
        if (to) entriesQuery = entriesQuery.lte('date', to);

        const { data: entries, error: entriesError } = await entriesQuery.order('date');

        if (entriesError) throw entriesError;
        
        console.log('Found entries:', entries ? entries.length : 0);

        // Get payments
        let paymentsQuery = supabase
            .from('payments')
            .select('id, date, amount, mode, reference')
            .eq('customer_id', id);

        if (from) paymentsQuery = paymentsQuery.gte('date', from);
        if (to) paymentsQuery = paymentsQuery.lte('date', to);

        const { data: payments, error: paymentsError } = await paymentsQuery.order('date');

        if (paymentsError) throw paymentsError;

        // Get advances
        let advancesQuery = supabase
            .from('advances')
            .select('id, date, amount, note, status')
            .eq('customer_id', id);

        if (from) advancesQuery = advancesQuery.gte('date', from);
        if (to) advancesQuery = advancesQuery.lte('date', to);

        const { data: advances, error: advancesError } = await advancesQuery.order('date');

        if (advancesError) throw advancesError;

        // Combine and sort
        const transactions = [
            ...entries.map(e => ({
                id: `E${e.id}`,
                date: e.date,
                shift: e.shift,
                quantity_litre: e.quantity_litre,
                rate_per_litre: e.rate_per_litre,
                fat: e.fat,
                snf: e.snf,
                amount: e.amount,
                type: 'MILK',
                description: `${e.shift === 'M' ? 'Morning' : 'Evening'} - ${e.quantity_litre}L @ ₹${e.rate_per_litre}`,
                credit: e.amount,
                debit: 0
            })),
            ...payments.map(p => ({
                id: `P${p.id}`,
                date: p.date,
                amount: p.amount,
                mode: p.mode,
                reference: p.reference,
                type: 'PAYMENT',
                description: `${p.mode}${p.reference ? ` (${p.reference})` : ''}`,
                credit: 0,
                debit: p.amount
            })),
            ...(advances || []).map(a => ({
                id: `A${a.id}`,
                date: a.date,
                amount: a.amount,
                note: a.note,
                status: a.status,
                type: 'ADVANCE',
                description: `Advance${a.note ? ` - ${a.note}` : ''} (${a.status})`,
                credit: 0,
                debit: a.amount
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Add running balance
        let balance = 0;
        transactions.forEach(t => {
            balance += t.credit - t.debit;
            t.balance = balance;
        });

        const totalAdvances = (advances || []).reduce((sum, a) => sum + (a.amount || 0), 0);
        
        const responseData = {
            entries: entries, // Send raw entries for the table
            payments: payments, // Send raw payments
            transactions,
            summary: {
                totalMilk: entries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0),
                totalAmount: entries.reduce((sum, e) => sum + (e.amount || 0), 0),
                totalPaid: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                totalAdvances,
                balance
            }
        };

        res.json(responseData);
    } catch (error) {
        console.error('Customer passbook error:', error);
        res.status(500).json({ error: 'Failed to fetch passbook' });
    }
}

/**
 * Create customer
 */
async function createCustomer(req, res) {
    try {
        const { amcuCustomerId, name, phone, address, milkTypeDefault, password } = req.body;

        if (!amcuCustomerId || !name) {
            return res.status(400).json({ error: 'AMCU ID and name are required' });
        }

        // Check if AMCU ID already exists
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('amcu_customer_id', amcuCustomerId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Customer with this AMCU ID already exists' });
        }

        const passwordHash = password ? bcrypt.hashSync(password, 10) : null;

        const { data: customer, error } = await supabase
            .from('customers')
            .insert({
                amcu_customer_id: amcuCustomerId,
                name,
                phone: phone || null,
                address: address || null,
                milk_type_default: milkTypeDefault || 'COW',
                password_hash: passwordHash
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ customer });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
}

/**
 * Update customer
 */
async function updateCustomer(req, res) {
    try {
        const { id } = req.params;
        const { name, phone, address, milkTypeDefault, password, amcuCustomerId, isActive } = req.body;

        const updateData = { updated_at: new Date().toISOString() };

        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (milkTypeDefault) updateData.milk_type_default = milkTypeDefault;
        if (amcuCustomerId) updateData.amcu_customer_id = amcuCustomerId;
        if (isActive !== undefined) updateData.is_active = isActive;
        if (password) updateData.password_hash = bcrypt.hashSync(password, 10);

        const { data: customer, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ customer });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
}

/**
 * Delete customer (soft delete)
 */
async function deleteCustomer(req, res) {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('customers')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Customer deactivated' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
}

module.exports = {
    getAllCustomers,
    getCustomerById,
    getCustomerSummary,
    getCustomerPassbook,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
