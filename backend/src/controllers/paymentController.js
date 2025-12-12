const { supabase, getLocalDate, getFirstDayOfMonth } = require('../config/supabase');
const { createNotification } = require('./customerPortalController');
const notificationService = require('../services/notificationService');

/**
 * Get all payments with filters
 */
async function getAllPayments(req, res) {
    try {
        const { from, to, customerId, mode, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('payments')
            .select(`
                *,
                customers!inner(name, amcu_customer_id)
            `, { count: 'exact' });

        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);
        if (customerId) query = query.eq('customer_id', customerId);
        if (mode) query = query.eq('mode', mode);

        query = query
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: payments, count, error } = await query;

        if (error) throw error;

        const transformedPayments = payments.map(p => ({
            ...p,
            customer_name: p.customers?.name,
            amcu_customer_id: p.customers?.amcu_customer_id
        }));

        res.json({
            payments: transformedPayments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
}

/**
 * Get payments for a specific customer
 */
async function getCustomerPayments(req, res) {
    try {
        const { customerId } = req.params;
        const { from, to, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('payments')
            .select('*', { count: 'exact' })
            .eq('customer_id', customerId);

        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);

        query = query
            .order('date', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: payments, count, error } = await query;

        if (error) throw error;

        res.json({
            payments,
            pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
        });
    } catch (error) {
        console.error('Get customer payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
}

/**
 * Create payment
 */
async function createPayment(req, res) {
    try {
        const { customerId, date, amount, mode, reference, notes, useAdvance } = req.body;

        if (!customerId || !date || !amount) {
            return res.status(400).json({ error: 'Customer, date, and amount are required' });
        }

        // Verify customer exists
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id, name')
            .eq('id', customerId)
            .eq('is_active', true)
            .single();

        if (customerError || !customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        let advanceUsed = 0;
        let finalAmount = amount;

        // If useAdvance is true, try to utilize active advances first
        if (useAdvance) {
            const { data: advances, error: advanceError } = await supabase
                .from('advances')
                .select('id, amount, utilized_amount')
                .eq('customer_id', customerId)
                .eq('status', 'active')
                .order('created_at', { ascending: true }); // Use oldest advances first

            if (!advanceError && advances && advances.length > 0) {
                let remainingPayment = amount;

                for (const advance of advances) {
                    const availableAdvance = advance.amount - (advance.utilized_amount || 0);
                    
                    if (availableAdvance > 0 && remainingPayment > 0) {
                        const toUse = Math.min(availableAdvance, remainingPayment);
                        advanceUsed += toUse;
                        remainingPayment -= toUse;

                        // Update the advance
                        const newUtilized = (advance.utilized_amount || 0) + toUse;
                        const newStatus = newUtilized >= advance.amount ? 'utilized' : 'active';

                        await supabase
                            .from('advances')
                            .update({ 
                                utilized_amount: newUtilized, 
                                status: newStatus,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', advance.id);
                    }

                    if (remainingPayment <= 0) break;
                }

                finalAmount = remainingPayment; // Amount after using advances
            }
        }

        // Create payment record (only if there's remaining amount or no advance was used)
        let payment = null;
        if (finalAmount > 0 || advanceUsed === 0) {
            const { data: newPayment, error } = await supabase
                .from('payments')
                .insert({
                    customer_id: customerId,
                    date,
                    amount: finalAmount > 0 ? finalAmount : amount,
                    mode: mode || 'CASH',
                    reference: reference || null,
                    notes: advanceUsed > 0 
                        ? `${notes || ''} (₹${advanceUsed} from advance)`.trim()
                        : (notes || null)
                })
                .select()
                .single();

            if (error) throw error;
            payment = newPayment;

            // Create in-app notification for customer
            await createNotification({
                customerId,
                type: 'payment',
                title: 'Payment Received',
                message: `₹${amount} received via ${mode || 'CASH'}${reference ? ` (Ref: ${reference})` : ''}`,
                amount: amount,
                entryDate: date,
                referenceId: newPayment.id
            });

            // Calculate remaining balance for notification
            const startDate = getFirstDayOfMonth();
            const endDate = getLocalDate();
            
            // Get total milk amount for this month
            const { data: entriesData } = await supabase
                .from('milk_entries')
                .select('amount')
                .eq('customer_id', customerId)
                .gte('date', startDate)
                .lte('date', endDate);
            
            const totalMilkAmount = (entriesData || []).reduce((sum, e) => sum + (e.amount || 0), 0);
            
            // Get total payments for this month
            const { data: paymentsData } = await supabase
                .from('payments')
                .select('amount')
                .eq('customer_id', customerId)
                .gte('date', startDate)
                .lte('date', endDate);
            
            const totalPayments = (paymentsData || []).reduce((sum, p) => sum + (p.amount || 0), 0);
            
            // Get total advances utilized
            const { data: advancesData } = await supabase
                .from('advances')
                .select('utilized_amount')
                .eq('customer_id', customerId);
            
            const totalAdvancesUsed = (advancesData || []).reduce((sum, a) => sum + (a.utilized_amount || 0), 0);
            
            const remainingBalance = totalMilkAmount - totalPayments - totalAdvancesUsed;

            // Send push notification with remaining balance (async, don't await)
            notificationService.sendPaymentNotification(newPayment, customer.name, remainingBalance)
                .catch(err => console.log('Push notification error:', err.message));
        }

        res.status(201).json({
            payment: payment ? {
                ...payment,
                customer_name: customer.name
            } : null,
            advanceUsed,
            message: advanceUsed > 0 
                ? `Payment recorded. ₹${advanceUsed} deducted from advance.`
                : 'Payment recorded successfully.'
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
}

/**
 * Update payment
 */
async function updatePayment(req, res) {
    try {
        const { id } = req.params;
        const { date, amount, mode, reference, notes } = req.body;

        // Check payment exists
        const { data: existing, error: findError } = await supabase
            .from('payments')
            .select('id')
            .eq('id', id)
            .single();

        if (findError || !existing) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const updateData = {};
        if (date) updateData.date = date;
        if (amount !== undefined) updateData.amount = amount;
        if (mode) updateData.mode = mode;
        if (reference !== undefined) updateData.reference = reference;
        if (notes !== undefined) updateData.notes = notes;

        const { data: payment, error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                customers!inner(name)
            `)
            .single();

        if (error) throw error;

        res.json({
            payment: {
                ...payment,
                customer_name: payment.customers?.name
            }
        });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ error: 'Failed to update payment' });
    }
}

/**
 * Delete payment
 */
async function deletePayment(req, res) {
    try {
        const { id } = req.params;

        const { data: payment, error: findError } = await supabase
            .from('payments')
            .select('id')
            .eq('id', id)
            .single();

        if (findError || !payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Payment deleted' });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ error: 'Failed to delete payment' });
    }
}

module.exports = {
    getAllPayments,
    getCustomerPayments,
    createPayment,
    updatePayment,
    deletePayment
};
