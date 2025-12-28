const { Expo } = require('expo-server-sdk');
const { supabase } = require('../config/supabase');

// Initialize Expo SDK
const expo = new Expo();

// Register Expo push token for a customer
const registerToken = async (customerId, token, deviceInfo = null) => {
    try {
        if (!Expo.isExpoPushToken(token)) {
            console.error(`Push token ${token} is not a valid Expo push token`);
            throw new Error('Invalid Expo push token');
        }

        const { data, error } = await supabase
            .from('fcm_tokens')
            .upsert({
                customer_id: customerId,
                token: token,
                device_info: deviceInfo,
                is_active: true,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'customer_id,token'
            })
            .select()
            .single();

        if (error) throw error;
        console.log(`Expo push token registered for customer ${customerId}`);
        return data;
    } catch (error) {
        console.error('Error registering push token:', error);
        throw error;
    }
};

// Get all active tokens for a customer
const getCustomerTokens = async (customerId) => {
    try {
        const { data, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('customer_id', customerId)
            .eq('is_active', true);

        if (error) throw error;
        return data.map(t => t.token);
    } catch (error) {
        console.error('Error getting customer tokens:', error);
        return [];
    }
};

// Send notification using Expo SDK
const sendToCustomer = async (customerId, title, body, data = {}) => {
    try {
        const tokens = await getCustomerTokens(customerId);

        if (tokens.length === 0) {
            console.log(`No tokens found for customer ${customerId}`);
            return { success: false, reason: 'No tokens found' };
        }

        const messages = [];
        const validTokens = [];

        for (const token of tokens) {
            if (!Expo.isExpoPushToken(token)) {
                console.warn(`Skipping invalid Expo push token: ${token}`);
                continue;
            }

            validTokens.push(token);
            messages.push({
                to: token,
                sound: 'default',
                title: title,
                body: body,
                data: { ...data, customerId }
            });
        }

        if (messages.length === 0) {
            return { success: false, reason: 'No valid tokens found' };
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending chunks:', error);
            }
        }

        console.log(`Sent ${messages.length} notifications to customer ${customerId}`);

        // Handle errors (optional cleanup of invalid tokens)
        // For simplicity, we just log ticket errors here
        const receiptIds = [];
        for (const ticket of tickets) {
            if (ticket.status === 'ok') {
                receiptIds.push(ticket.id);
            }
        }

        return { success: true, count: messages.length };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, reason: error.message };
    }
};

// Helper for milk entry
const sendMilkEntryNotification = async (entry, customerName) => {
    const formattedDate = new Date(entry.date).toLocaleDateString();
    const shift = entry.shift === 'M' ? 'Morning' : 'Evening';
    const body = `Milk Collected: ${entry.quantity_litre}L (${shift})\nFat: ${entry.fat}, SNF: ${entry.snf}\nAmount: ₹${entry.amount}`;

    return sendToCustomer(entry.customer_id, 'Milk Entry Added', body, {
        type: 'entry',
        id: entry.id
    });
};

// Helper for payment
const sendPaymentNotification = async (payment, customerName) => {
    const formattedDate = new Date(payment.date).toLocaleDateString();
    const body = `Payment Received: ₹${payment.amount}\nMode: ${payment.mode}`;

    return sendToCustomer(payment.customer_id, 'Payment Received', body, {
        type: 'payment',
        id: payment.id
    });
};

// Helper for broadcast
const sendBroadcast = async (title, body, data = {}) => {
    try {
        const { data: allTokens, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('is_active', true);

        if (error) throw error;

        const messages = [];
        for (const t of allTokens) {
            if (Expo.isExpoPushToken(t.token)) {
                messages.push({
                    to: t.token,
                    sound: 'default',
                    title: title,
                    body: body,
                    data: { ...data, type: 'broadcast' }
                });
            }
        }

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
        }

        return { success: true, count: messages.length };
    } catch (error) {
        console.error('Error sending broadcast:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    registerToken,
    sendToCustomer,
    sendMilkEntryNotification,
    sendPaymentNotification,
    sendBroadcast
};
