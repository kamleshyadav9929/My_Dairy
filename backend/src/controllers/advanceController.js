const { supabase } = require('../config/supabase');

/**
 * Get all advances with optional filtering
 */
async function getAllAdvances(req, res) {
    try {
        const { customerId, status, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('advances')
            .select('*, customers(name, amcu_customer_id)', { count: 'exact' });

        if (customerId) {
            query = query.eq('customer_id', customerId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: advances, count, error } = await query;

        if (error) throw error;

        res.json({
            advances,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get advances error:', error);
        res.status(500).json({ error: 'Failed to fetch advances' });
    }
}

/**
 * Create a new advance payment
 */
async function createAdvance(req, res) {
    try {
        const { customerId, amount, date, note } = req.body;

        if (!customerId || !amount) {
            return res.status(400).json({ error: 'Customer ID and amount are required' });
        }

        const { data: advance, error } = await supabase
            .from('advances')
            .insert({
                customer_id: customerId,
                amount: parseFloat(amount),
                date: date || new Date().toISOString().split('T')[0],
                note: note || null,
                status: 'active',
                utilized_amount: 0
            })
            .select('*, customers(name, amcu_customer_id)')
            .single();

        if (error) throw error;

        res.status(201).json({ advance });
    } catch (error) {
        console.error('Create advance error:', error);
        res.status(500).json({ error: 'Failed to create advance' });
    }
}

/**
 * Update an advance (e.g., mark as utilized)
 */
async function updateAdvance(req, res) {
    try {
        const { id } = req.params;
        const { status, utilizedAmount, note } = req.body;

        const updateData = { updated_at: new Date().toISOString() };

        if (status) updateData.status = status;
        if (utilizedAmount !== undefined) updateData.utilized_amount = parseFloat(utilizedAmount);
        if (note !== undefined) updateData.note = note;

        const { data: advance, error } = await supabase
            .from('advances')
            .update(updateData)
            .eq('id', id)
            .select('*, customers(name, amcu_customer_id)')
            .single();

        if (error) throw error;

        res.json({ advance });
    } catch (error) {
        console.error('Update advance error:', error);
        res.status(500).json({ error: 'Failed to update advance' });
    }
}

/**
 * Delete an advance
 */
async function deleteAdvance(req, res) {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('advances')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Advance deleted' });
    } catch (error) {
        console.error('Delete advance error:', error);
        res.status(500).json({ error: 'Failed to delete advance' });
    }
}

/**
 * Get customer's advance balance
 */
async function getCustomerAdvanceBalance(req, res) {
    try {
        const { customerId } = req.params;

        const { data: advances, error } = await supabase
            .from('advances')
            .select('amount, utilized_amount')
            .eq('customer_id', customerId)
            .eq('status', 'active');

        if (error) throw error;

        const totalAdvance = (advances || []).reduce((sum, a) => sum + (a.amount || 0), 0);
        const totalUtilized = (advances || []).reduce((sum, a) => sum + (a.utilized_amount || 0), 0);
        const availableBalance = totalAdvance - totalUtilized;

        res.json({
            totalAdvance,
            totalUtilized,
            availableBalance,
            activeAdvances: (advances || []).length
        });
    } catch (error) {
        console.error('Get advance balance error:', error);
        res.status(500).json({ error: 'Failed to fetch advance balance' });
    }
}

module.exports = {
    getAllAdvances,
    createAdvance,
    updateAdvance,
    deleteAdvance,
    getCustomerAdvanceBalance
};
