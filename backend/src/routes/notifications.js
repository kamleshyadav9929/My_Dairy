const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const notificationService = require('../services/notificationService');

// Middleware to verify customer token
const verifyCustomerToken = require('../middleware/customerAuth');

// Middleware to verify admin token
const verifyAdminToken = require('../middleware/auth');

/**
 * Register FCM token for push notifications
 * POST /api/notifications/register
 */
router.post('/register', verifyCustomerToken, async (req, res) => {
    try {
        const { token, deviceInfo } = req.body;
        const customerId = req.customer.id;

        if (!token) {
            return res.status(400).json({ error: 'FCM token is required' });
        }

        const result = await notificationService.registerToken(customerId, token, deviceInfo);
        res.json({ success: true, message: 'Token registered successfully' });
    } catch (error) {
        console.error('Error registering FCM token:', error);
        res.status(500).json({ error: 'Failed to register token' });
    }
});

/**
 * Send notification to specific customer (Admin only)
 * POST /api/notifications/send
 */
router.post('/send', verifyAdminToken, async (req, res) => {
    try {
        const { customerId, title, body, data } = req.body;

        if (!customerId || !title || !body) {
            return res.status(400).json({ error: 'customerId, title, and body are required' });
        }

        const result = await notificationService.sendToCustomer(customerId, title, body, data || {});
        res.json(result);
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

/**
 * Send broadcast notification to all customers (Admin only)
 * POST /api/notifications/broadcast
 */
router.post('/broadcast', verifyAdminToken, async (req, res) => {
    try {
        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: 'title and body are required' });
        }

        const result = await notificationService.sendBroadcast(title, body, data || {});
        res.json(result);
    } catch (error) {
        console.error('Error sending broadcast:', error);
        res.status(500).json({ error: 'Failed to send broadcast' });
    }
});

/**
 * Test notification (Admin only - for debugging)
 * POST /api/notifications/test
 */
router.post('/test', verifyAdminToken, async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: 'customerId is required' });
        }

        const result = await notificationService.sendToCustomer(
            customerId,
            '🔔 Test Notification',
            'This is a test notification from My Dairy app!',
            { type: 'test' }
        );
        
        res.json(result);
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

/**
 * Unregister FCM token (when customer logs out)
 * DELETE /api/notifications/unregister
 */
router.delete('/unregister', verifyCustomerToken, async (req, res) => {
    try {
        const { token } = req.body;
        const customerId = req.customer.id;

        if (!token) {
            return res.status(400).json({ error: 'FCM token is required' });
        }

        await supabase
            .from('fcm_tokens')
            .update({ is_active: false })
            .eq('customer_id', customerId)
            .eq('token', token);

        res.json({ success: true, message: 'Token unregistered successfully' });
    } catch (error) {
        console.error('Error unregistering FCM token:', error);
        res.status(500).json({ error: 'Failed to unregister token' });
    }
});

module.exports = router;
