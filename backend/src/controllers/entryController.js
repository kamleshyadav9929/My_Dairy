const { supabase, getLocalDate } = require('../config/supabase');
const rateService = require('../services/rateService');
const pdfService = require('../services/pdfService');
const { createNotification } = require('./customerPortalController');
const notificationService = require('../services/notificationService');

/**
 * Get all milk entries with filters
 */
async function getAllEntries(req, res) {
    try {
        const { 
            from, to, customerId, shift, milkType, source,
            page = 1, limit = 50 
        } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('milk_entries')
            .select(`
                *,
                customers!inner(name, amcu_customer_id)
            `, { count: 'exact' });

        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);
        if (customerId) query = query.eq('customer_id', customerId);
        if (shift) query = query.eq('shift', shift);
        if (milkType) query = query.eq('milk_type', milkType);
        if (source) query = query.eq('source', source);

        query = query
            .order('date', { ascending: false })
            .order('time', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: entries, count, error } = await query;

        if (error) throw error;

        // Transform to match expected format
        const transformedEntries = entries.map(e => {
            let displayTime = e.time;
            if (!displayTime && e.created_at) {
                // Extract HH:MM:SS from ISO timestamp
                const date = new Date(e.created_at);
                displayTime = date.toLocaleTimeString('en-GB', { hour12: true, hour: '2-digit', minute: '2-digit' });
            }
            return {
                ...e,
                time: displayTime,
                customer_name: e.customers?.name,
                amcu_customer_id: e.customers?.amcu_customer_id
            };
        });

        res.json({
            entries: transformedEntries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Get entries error:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
}

/**
 * Get entries for a specific customer
 */
async function getCustomerEntries(req, res) {
    try {
        const { customerId } = req.params;
        const { from, to, shift, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('milk_entries')
            .select('*')
            .eq('customer_id', customerId);

        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);
        if (shift) query = query.eq('shift', shift);

        query = query
            .order('date', { ascending: false })
            .order('time', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: entries, error } = await query;

        if (error) throw error;

        res.json({ entries });
    } catch (error) {
        console.error('Get customer entries error:', error);
        res.status(500).json({ error: 'Failed to fetch entries' });
    }
}

/**
 * Get today's entries and stats
 */
async function getTodayStats(req, res) {
    try {
        const today = req.query.date || getLocalDate();

        // Get entries for today with customer info
        const { data: entries, error: entriesError } = await supabase
            .from('milk_entries')
            .select(`
                *,
                customers!inner(name, amcu_customer_id)
            `)
            .eq('date', today)
            .order('id', { ascending: false })
            .limit(10);

        if (entriesError) throw entriesError;

        // Calculate stats
        const { data: allEntries, error: statsError } = await supabase
            .from('milk_entries')
            .select('quantity_litre, amount, shift')
            .eq('date', today);

        if (statsError) throw statsError;

        const stats = {
            entryCount: allEntries.length,
            totalLitres: allEntries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0),
            totalAmount: allEntries.reduce((sum, e) => sum + (e.amount || 0), 0),
            morningLitres: allEntries.filter(e => e.shift === 'M').reduce((sum, e) => sum + (e.quantity_litre || 0), 0),
            eveningLitres: allEntries.filter(e => e.shift === 'E').reduce((sum, e) => sum + (e.quantity_litre || 0), 0)
        };

        // Transform entries
        const transformedEntries = entries.map(e => ({
            ...e,
            customer_name: e.customers?.name,
            amcu_customer_id: e.customers?.amcu_customer_id
        }));

        // Get top customers
        const { data: topCustomersRaw, error: topError } = await supabase
            .from('milk_entries')
            .select(`
                customer_id,
                quantity_litre,
                amount,
                customers!inner(id, name, amcu_customer_id)
            `)
            .eq('date', today);

        if (topError) throw topError;

        // Aggregate top customers
        const customerMap = {};
        topCustomersRaw.forEach(e => {
            const id = e.customer_id;
            if (!customerMap[id]) {
                customerMap[id] = {
                    id,
                    name: e.customers?.name,
                    amcu_customer_id: e.customers?.amcu_customer_id,
                    total_litres: 0,
                    total_amount: 0
                };
            }
            customerMap[id].total_litres += e.quantity_litre || 0;
            customerMap[id].total_amount += e.amount || 0;
        });

        const topCustomers = Object.values(customerMap)
            .sort((a, b) => b.total_litres - a.total_litres)
            .slice(0, 5);

        res.json({
            date: today,
            stats,
            entries: transformedEntries,
            topCustomers
        });
    } catch (error) {
        console.error('Get today stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}

/**
 * Create manual milk entry
 */
async function createEntry(req, res) {
    try {
        const {
            customerId, date, time, shift, milkType,
            quantityLitre, fat, snf, clr, ratePerLitre, amount: directAmount, notes, source
        } = req.body;

        if (!customerId || !date || !shift || !quantityLitre) {
            return res.status(400).json({ error: 'Customer, date, shift, and quantity are required' });
        }

        // Verify customer exists
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .eq('is_active', true)
            .single();

        if (customerError || !customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const actualMilkType = milkType || customer.milk_type_default || 'COW';
        
        // If amount is provided directly (from AMCU), use it
        // Otherwise calculate from rate cards
        let rate = ratePerLitre;
        let amount = directAmount;
        
        if (!amount) {
            if (!rate) {
                rate = rateService.calculateRate(actualMilkType, fat || 4.0, snf || 8.5);
            }
            amount = rateService.calculateAmount(quantityLitre, rate);
        } else if (!rate && amount) {
            // Calculate rate from amount if not provided
            rate = amount / quantityLitre;
        }

        const { data: entry, error: insertError } = await supabase
            .from('milk_entries')
            .insert({
                customer_id: customerId,
                date,
                time: time || null,
                shift,
                milk_type: actualMilkType,
                quantity_litre: quantityLitre,
                fat: fat || null,
                snf: snf || null,
                clr: clr || null,
                rate_per_litre: rate,
                amount,
                source: 'MANUAL',
                notes: notes || null
            })
            .select(`
                *,
                customers!inner(name)
            `)
            .single();

        if (insertError) throw insertError;

        // Create in-app notification for customer
        await createNotification({
            customerId,
            type: 'entry',
            title: `Milk Entry - ${shift === 'M' ? 'Morning' : 'Evening'}`,
            message: `${quantityLitre}L ${actualMilkType} collected. Fat: ${fat || '-'}%, SNF: ${snf || '-'}%`,
            amount: amount,
            entryDate: date,
            referenceId: entry.id
        });

        // Send push notification (async, don't await)
        notificationService.sendMilkEntryNotification(entry, customer.name)
            .catch(err => console.log('Push notification error:', err.message));

        res.status(201).json({ 
            entry: {
                ...entry,
                customer_name: entry.customers?.name
            }
        });
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Failed to create entry' });
    }
}

/**
 * Update milk entry
 */
async function updateEntry(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Get existing entry
        const { data: entry, error: findError } = await supabase
            .from('milk_entries')
            .select('*')
            .eq('id', id)
            .single();

        if (findError || !entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Recalculate amount if quantity or rate changed
        let amount = updates.amount;
        if (updates.quantityLitre !== undefined || updates.ratePerLitre !== undefined) {
            const qty = updates.quantityLitre || entry.quantity_litre;
            const rate = updates.ratePerLitre || entry.rate_per_litre;
            amount = rateService.calculateAmount(qty, rate);
        }

        const updateData = {};
        if (updates.date) updateData.date = updates.date;
        if (updates.time) updateData.time = updates.time;
        if (updates.shift) updateData.shift = updates.shift;
        if (updates.milkType) updateData.milk_type = updates.milkType;
        if (updates.quantityLitre) updateData.quantity_litre = updates.quantityLitre;
        if (updates.fat !== undefined) updateData.fat = updates.fat;
        if (updates.snf !== undefined) updateData.snf = updates.snf;
        if (updates.clr !== undefined) updateData.clr = updates.clr;
        if (updates.ratePerLitre) updateData.rate_per_litre = updates.ratePerLitre;
        if (amount) updateData.amount = amount;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        updateData.updated_at = new Date().toISOString();

        const { data: updated, error: updateError } = await supabase
            .from('milk_entries')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                customers!inner(name)
            `)
            .single();

        if (updateError) throw updateError;

        res.json({ 
            entry: {
                ...updated,
                customer_name: updated.customers?.name
            }
        });
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Failed to update entry' });
    }
}

/**
 * Delete milk entry
 */
async function deleteEntry(req, res) {
    try {
        const { id } = req.params;

        const { data: entry, error: findError } = await supabase
            .from('milk_entries')
            .select('id')
            .eq('id', id)
            .single();

        if (findError || !entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        const { error: deleteError } = await supabase
            .from('milk_entries')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.json({ message: 'Entry deleted' });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
}

/**
 * Export entries to CSV
 */
async function exportCSV(req, res) {
    try {
        const { from, to, customerId } = req.query;

        let query = supabase
            .from('milk_entries')
            .select(`
                date, time, shift, milk_type, quantity_litre, fat, snf, clr,
                rate_per_litre, amount, source,
                customers!inner(name, amcu_customer_id)
            `);

        if (from) query = query.gte('date', from);
        if (to) query = query.lte('date', to);
        if (customerId) query = query.eq('customer_id', customerId);

        query = query.order('date', { ascending: false }).order('time', { ascending: false });

        const { data: entries, error } = await query;

        if (error) throw error;

        // Generate CSV
        const headers = ['Date', 'Time', 'Customer', 'AMCU ID', 'Shift', 'Type', 'Qty(L)', 'Fat', 'SNF', 'CLR', 'Rate', 'Amount', 'Source'];
        const rows = entries.map(e => [
            e.date, e.time || '', e.customers?.name, e.customers?.amcu_customer_id,
            e.shift, e.milk_type, e.quantity_litre, e.fat || '', e.snf || '', e.clr || '',
            e.rate_per_litre, e.amount, e.source
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=entries_${from || 'all'}_${to || 'all'}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({ error: 'Failed to export' });
    }
}

/**
 * Export daily report to PDF
 */
async function exportDailyPDF(req, res) {
    try {
        const { date } = req.query;
        const reportDate = date || getLocalDate();

        const { data: entries, error: entriesError } = await supabase
            .from('milk_entries')
            .select(`
                *,
                customers!inner(name)
            `)
            .eq('date', reportDate)
            .order('time');

        if (entriesError) throw entriesError;

        const transformedEntries = entries.map(e => ({
            ...e,
            customer_name: e.customers?.name
        }));

        const totals = {
            count: entries.length,
            litres: entries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0),
            amount: entries.reduce((sum, e) => sum + (e.amount || 0), 0)
        };

        const { data: settings } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'dairy_name')
            .single();

        const dairyName = settings?.value || 'Dairy';

        const pdfBuffer = await pdfService.generateDailyReport(reportDate, transformedEntries, totals, dairyName);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${reportDate}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Export PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
}

module.exports = {
    getAllEntries,
    getCustomerEntries,
    getTodayStats,
    createEntry,
    updateEntry,
    deleteEntry,
    exportCSV,
    exportDailyPDF
};
