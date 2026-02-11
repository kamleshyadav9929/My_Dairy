const { supabase, getLocalDate, getFirstDayOfMonth } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Customer Login
 */
async function login(req, res) {
    try {
        const { customerIdOrPhone, password } = req.body;

        console.log('Customer login attempt:', customerIdOrPhone);

        // First try to find by AMCU customer ID
        let { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('amcu_customer_id', customerIdOrPhone)
            .eq('is_active', true)
            .maybeSingle();

        // If not found, try by phone
        if (!customer) {
            const phoneResult = await supabase
                .from('customers')
                .select('*')
                .eq('phone', customerIdOrPhone)
                .eq('is_active', true)
                .maybeSingle();

            customer = phoneResult.data;
            error = phoneResult.error;
        }

        console.log('Customer found:', customer ? customer.name : 'none', 'Error:', error?.message);

        if (error || !customer) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // For this demo, if password_hash is null, allow login with default '1234'
        const validPassword = customer.password_hash
            ? bcrypt.compareSync(password, customer.password_hash)
            : password === '1234';

        console.log('Password valid:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: customer.id, role: 'customer', name: customer.name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            customer: {
                id: customer.id,
                name: customer.name,
                amcuId: customer.amcu_customer_id,
                phone: customer.phone
            }
        });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

const NodeCache = require('node-cache');
const dashboardCache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

/**
 * Get customer dashboard (monthly summary)
 */
async function getDashboard(req, res) {
    try {
        const customerId = req.user ? req.user.id : null;
        const { from, to } = req.query;

        if (!customerId) {
            console.error('GetDashboard: Missing customer ID in request user object');
            return res.status(400).json({ error: 'User not authenticated correctly' });
        }

        const start = from || getFirstDayOfMonth();
        const end = to || getLocalDate();

        // Cache Key
        const cacheKey = `dashboard_stats_${customerId}_${start}_${end}`;
        const cachedStats = dashboardCache.get(cacheKey);

        if (cachedStats) {
            console.log(`[Cache Hit] Serving dashboard for ${customerId}`);
            return res.json(cachedStats);
        }

        console.log(`Fetching dashboard for Customer: ${customerId}, Date Range: ${start} to ${end}`);

        // Debug query first
        const { count, error: countError } = await supabase
            .from('milk_entries')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .gte('date', start)
            .lte('date', end);

        console.log(`Found ${count} entries for this range.`);

        const { data, error } = await supabase
            .from('milk_entries')
            .select('date, quantity_litre, amount, fat, snf')
            .eq('customer_id', customerId)
            .gte('date', start)
            .lte('date', end);

        if (error) {
            console.error('Supabase error fetching dashboard entries:', error);
            throw error;
        }

        const entries = data || [];

        const uniqueDates = new Set(entries.map(e => e.date));
        const totalQty = entries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0);

        const stats = {
            pouringDays: uniqueDates.size,
            totalMilkQty: totalQty,
            totalAmount: entries.reduce((sum, e) => sum + (e.amount || 0), 0),
            avgFat: totalQty > 0 ? entries.reduce((sum, e) => sum + ((e.fat || 0) * (e.quantity_litre || 0)), 0) / totalQty : 0,
            avgSnf: totalQty > 0 ? entries.reduce((sum, e) => sum + ((e.snf || 0) * (e.quantity_litre || 0)), 0) / totalQty : 0
        };

        // Save to cache
        dashboardCache.set(cacheKey, stats);

        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
    }
}

/**
 * Get today's collection for customer
 */
async function getTodayCollection(req, res) {
    try {
        const customerId = req.user.id;
        const date = req.query.date || getLocalDate();

        const { data, error } = await supabase
            .from('milk_entries')
            .select('shift, quantity_litre, fat, snf, rate_per_litre, amount')
            .eq('customer_id', customerId)
            .eq('date', date);

        console.log(`[getTodayCollection] Customer: ${customerId}, Date: ${date}, Entries found: ${data?.length}`);

        if (error) throw error;

        const entries = data || [];

        const calculateStats = (shiftEntries) => {
            const qty = shiftEntries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0);

            if (qty === 0) {
                return { qty: 0, fat: 0, snf: 0, amount: 0 };
            }

            const amount = shiftEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
            // Weighted averages (exclude 0 fat/snf entries from average calculation)
            const validFatEntries = shiftEntries.filter(e => (e.fat || 0) > 0);
            const validSnfEntries = shiftEntries.filter(e => (e.snf || 0) > 0);

            const qtyForFat = validFatEntries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0);
            const qtyForSnf = validSnfEntries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0);

            const fat = qtyForFat > 0
                ? validFatEntries.reduce((sum, e) => sum + ((e.fat || 0) * (e.quantity_litre || 0)), 0) / qtyForFat
                : 0;

            const snf = qtyForSnf > 0
                ? validSnfEntries.reduce((sum, e) => sum + ((e.snf || 0) * (e.quantity_litre || 0)), 0) / qtyForSnf
                : 0;

            return {
                qty: parseFloat(qty.toFixed(2)),
                fat: parseFloat(fat.toFixed(2)),
                snf: parseFloat(snf.toFixed(2)),
                amount: parseFloat(amount.toFixed(2))
            };
        };

        res.json({
            date,
            morning: calculateStats(entries.filter(e => e.shift === 'M')),
            evening: calculateStats(entries.filter(e => e.shift === 'E'))
        });
    } catch (error) {
        console.error('Today collection error:', error);
        res.status(500).json({ error: 'Failed to fetch today collection' });
    }
}

/**
 * Get last N days collection
 */
async function getLastDaysCollection(req, res) {
    try {
        const customerId = req.user.id;
        const days = parseInt(req.query.days) || 10;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('milk_entries')
            .select('date, quantity_litre, amount')
            .eq('customer_id', customerId)
            .gte('date', getLocalDate(startDate))
            .lte('date', getLocalDate(endDate))
            .order('date', { ascending: true });

        if (error) throw error;

        const entries = data || [];

        // Group by date
        const dateMap = {};
        entries.forEach(e => {
            if (!dateMap[e.date]) {
                dateMap[e.date] = { date: e.date, totalQty: 0, totalAmount: 0 };
            }
            dateMap[e.date].totalQty += e.quantity_litre || 0;
            dateMap[e.date].totalAmount += e.amount || 0;
        });

        res.json(Object.values(dateMap));
    } catch (error) {
        console.error('Last days collection error:', error);
        res.status(500).json({ error: 'Failed to fetch collection data' });
    }
}

/**
 * Get customer payments
 */
async function getPayments(req, res) {
    try {
        const customerId = req.user.id;
        const { from, to, limit = 10, page = 1 } = req.query;
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
        console.error('Payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
}

/**
 * Get customer passbook
 */
async function getPassbook(req, res) {
    try {
        const customerId = req.user.id;
        const { from, to } = req.query;

        const start = from || getFirstDayOfMonth();
        const end = to || getLocalDate();

        // Get entries
        const { data: entriesData, error: entriesError } = await supabase
            .from('milk_entries')
            .select('id, date, shift, quantity_litre, fat, snf, rate_per_litre, amount')
            .eq('customer_id', customerId)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });

        if (entriesError) throw entriesError;

        const entries = entriesData || [];

        // Get payments
        const { data: paymentsData, error: paymentsError } = await supabase
            .from('payments')
            .select('id, date, amount, mode, reference')
            .eq('customer_id', customerId)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });

        if (paymentsError) throw paymentsError;

        const payments = paymentsData || [];

        // Get advances (active ones that reduce balance)
        const { data: advancesData } = await supabase
            .from('advances')
            .select('id, date, amount, utilized_amount, note')
            .eq('customer_id', customerId)
            .eq('status', 'active');

        const advances = advancesData || [];
        const totalAdvances = advances.reduce((sum, a) => sum + (a.amount || 0) - (a.utilized_amount || 0), 0);

        // Combine and sort
        const transactions = [
            ...entries.map(e => ({
                id: `E${e.id}`,
                date: e.date,
                type: 'MILK',
                description: `${e.shift === 'M' ? 'Morning' : 'Evening'} - ${e.quantity_litre}L`,
                credit: e.amount,
                debit: 0,
                details: e
            })),
            ...payments.map(p => ({
                id: `P${p.id}`,
                date: p.date,
                type: 'PAYMENT',
                description: `${p.mode} Payment${p.reference ? ` (${p.reference})` : ''}`,
                credit: 0,
                debit: p.amount,
                details: p
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let balance = 0;
        transactions.forEach(t => {
            balance += t.credit - t.debit;
            t.balance = balance;
        });

        // Final balance should include advances deduction (same as admin panel)
        const totalMilkAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalMilkQty = entries.reduce((sum, e) => sum + (e.quantity_litre || 0), 0);
        const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const finalBalance = totalMilkAmount - totalPayments - totalAdvances;

        const summary = {
            totalMilkAmount,
            totalMilk: totalMilkQty, // Added for Passbook PDF
            totalPayments,
            totalAdvances,
            balance: finalBalance
        };

        res.json({ transactions, summary });
    } catch (error) {
        console.error('Passbook error:', error);
        res.status(500).json({ error: 'Failed to fetch passbook' });
    }
}

/**
 * Get customer profile
 */
async function getProfile(req, res) {
    try {
        const customerId = req.user.id;

        const { data: customer, error } = await supabase
            .from('customers')
            .select('id, amcu_customer_id, name, phone, address, milk_type_default, created_at')
            .eq('id', customerId)
            .single();

        if (error) throw error;

        res.json({
            id: customer.id,
            amcuId: customer.amcu_customer_id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            defaultMilkType: customer.milk_type_default,
            memberSince: customer.created_at
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

/**
 * Get notifications from database
 */
async function getNotifications(req, res) {
    try {
        const customerId = req.user.id;
        const { limit = 30, unreadOnly = false } = req.query;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (unreadOnly === 'true') {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) throw error;

        res.json({ notifications: notifications || [] });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

/**
 * Mark single notification as read
 */
async function markNotificationRead(req, res) {
    try {
        const customerId = req.user.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('customer_id', customerId)
            .select()
            .single();

        if (error) throw error;

        res.json({ notification: data });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsRead(req, res) {
    try {
        const customerId = req.user.id;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('customer_id', customerId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
}

/**
 * Get unread notification count
 */
async function getUnreadCount(req, res) {
    try {
        const customerId = req.user.id;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ unreadCount: count || 0 });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
}

/**
 * Create notification helper (used by entry/payment controllers)
 */
async function createNotification({ customerId, type, title, message, amount, entryDate, referenceId }) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                customer_id: customerId,
                type,
                title,
                message,
                amount,
                entry_date: entryDate,
                reference_id: referenceId,
                is_read: false
            })
            .select()
            .single();

        if (error) {
            console.error('Create notification error:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
}

/**
 * Get news
 */
async function getNews(req, res) {
    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('id, title, content, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        res.json({ news: news || [] });
    } catch (error) {
        console.error('News error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
}

module.exports = {
    login,
    getDashboard,
    getTodayCollection,
    getLastDaysCollection,
    getPayments,
    getPassbook,
    getProfile,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getUnreadCount,
    createNotification,
    getNews
};
