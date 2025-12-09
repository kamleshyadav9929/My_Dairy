const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Admin Login
 */
async function adminLogin(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('role', 'admin')
            .eq('is_active', true)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: 'admin', username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

/**
 * Customer Login (delegated to customerPortalController)
 */
async function customerLogin(req, res) {
    try {
        const { customerId, password } = req.body;

        if (!customerId || !password) {
            return res.status(400).json({ error: 'Customer ID and password are required' });
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('amcu_customer_id', customerId)
            .eq('is_active', true)
            .single();

        if (error || !customer) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = customer.password_hash
            ? bcrypt.compareSync(password, customer.password_hash)
            : password === '1234';

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
            user: {
                id: customer.id,
                name: customer.name,
                amcuId: customer.amcu_customer_id,
                role: 'customer'
            }
        });
    } catch (error) {
        console.error('Customer login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}

/**
 * Get current user
 */
async function getMe(req, res) {
    try {
        const { id, role } = req.user;

        if (role === 'admin') {
            const { data: user, error } = await supabase
                .from('users')
                .select('id, username, name, phone, email, role')
                .eq('id', id)
                .single();

            if (error) throw error;
            return res.json({ user });
        } else {
            const { data: customer, error } = await supabase
                .from('customers')
                .select('id, amcu_customer_id, name, phone')
                .eq('id', id)
                .single();

            if (error) throw error;
            return res.json({
                user: {
                    ...customer,
                    role: 'customer'
                }
            });
        }
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
}

/**
 * Change password (for both admin and customer)
 */
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const { id, role } = req.user;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password required' });
        }

        if (newPassword.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        let table = role === 'admin' ? 'users' : 'customers';

        const { data: user, error: findError } = await supabase
            .from(table)
            .select('password_hash')
            .eq('id', id)
            .single();

        if (findError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // For customers without password, check default
        const hasPassword = !!user.password_hash;
        const validPassword = hasPassword
            ? bcrypt.compareSync(currentPassword, user.password_hash)
            : currentPassword === '1234';

        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);

        const { error: updateError } = await supabase
            .from(table)
            .update({ password_hash: newHash, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
}

/**
 * Request password reset (creates a reset request that admin can see)
 */
async function requestPasswordReset(req, res) {
    try {
        const { customerId, phone } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        // Find customer
        const { data: customer, error: findError } = await supabase
            .from('customers')
            .select('id, name, phone, amcu_customer_id')
            .eq('amcu_customer_id', customerId)
            .eq('is_active', true)
            .single();

        if (findError || !customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Verify phone if provided (optional extra security)
        if (phone && customer.phone && !customer.phone.includes(phone.slice(-4))) {
            return res.status(400).json({ error: 'Phone number does not match' });
        }

        // Create reset request in a simple table or just store in settings/logs
        // For simplicity, we'll create a password_reset_requests entry
        const { error: insertError } = await supabase
            .from('password_reset_requests')
            .insert({
                customer_id: customer.id,
                customer_name: customer.name,
                amcu_customer_id: customer.amcu_customer_id,
                status: 'pending',
                created_at: new Date().toISOString()
            });

        // If table doesn't exist, ignore and continue
        if (insertError && !insertError.message.includes('does not exist')) {
            console.error('Reset request insert error:', insertError);
        }

        res.json({ 
            message: 'Password reset request submitted. Please contact the dairy admin.',
            customerName: customer.name
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({ error: 'Failed to submit reset request' });
    }
}

/**
 * Admin: Reset customer password
 */
async function adminResetCustomerPassword(req, res) {
    try {
        const { customerId, newPassword } = req.body;
        const { role } = req.user;

        if (role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can reset customer passwords' });
        }

        if (!customerId || !newPassword) {
            return res.status(400).json({ error: 'Customer ID and new password required' });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);

        const { data: customer, error } = await supabase
            .from('customers')
            .update({ password_hash: newHash, updated_at: new Date().toISOString() })
            .eq('id', customerId)
            .select('name, amcu_customer_id')
            .single();

        if (error) throw error;

        res.json({ 
            message: `Password reset for ${customer.name} (${customer.amcu_customer_id})`,
            customer
        });
    } catch (error) {
        console.error('Admin reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
}

module.exports = {
    adminLogin,
    customerLogin,
    getMe,
    changePassword,
    requestPasswordReset,
    adminResetCustomerPassword
};
