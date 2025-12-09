const admin = require('firebase-admin');
const { supabase } = require('../config/supabase');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
    if (firebaseInitialized) return true;

    try {
        // Try to load service account from environment variable or file
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
            path.join(__dirname, '../../firebase-service-account.json');
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Parse from environment variable (for production)
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            firebaseInitialized = true;
            console.log('Firebase Admin initialized from environment variable');
        } else if (fs.existsSync(serviceAccountPath)) {
            // Load from file (for development)
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            firebaseInitialized = true;
            console.log('Firebase Admin initialized from service account file');
        } else {
            console.warn('Firebase service account not found. Push notifications disabled.');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error.message);
        return false;
    }
};

// Register FCM token for a customer
const registerToken = async (customerId, token, deviceInfo = null) => {
    try {
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
        console.log(`FCM token registered for customer ${customerId}`);
        return data;
    } catch (error) {
        console.error('Error registering FCM token:', error);
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

// Send notification to a specific customer
const sendToCustomer = async (customerId, title, body, data = {}) => {
    if (!initializeFirebase()) {
        console.warn('Firebase not initialized, skipping notification');
        return { success: false, reason: 'Firebase not initialized' };
    }

    try {
        const tokens = await getCustomerTokens(customerId);
        
        if (tokens.length === 0) {
            console.log(`No FCM tokens found for customer ${customerId}`);
            return { success: false, reason: 'No tokens found' };
        }

        const message = {
            notification: { title, body },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                customerId: String(customerId)
            },
            tokens: tokens
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        
        console.log(`Notification sent to customer ${customerId}:`, {
            successCount: response.successCount,
            failureCount: response.failureCount
        });

        // Remove invalid tokens
        if (response.failureCount > 0) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(tokens[idx]);
                }
            });
            
            if (invalidTokens.length > 0) {
                await deactivateTokens(invalidTokens);
            }
        }

        return { success: true, successCount: response.successCount };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, reason: error.message };
    }
};

// Deactivate invalid tokens
const deactivateTokens = async (tokens) => {
    try {
        await supabase
            .from('fcm_tokens')
            .update({ is_active: false })
            .in('token', tokens);
        console.log(`Deactivated ${tokens.length} invalid tokens`);
    } catch (error) {
        console.error('Error deactivating tokens:', error);
    }
};

// Send milk entry notification
const sendMilkEntryNotification = async (entry, customerName) => {
    const title = '🥛 नई दूध एंट्री';
    const body = `${entry.quantity_litre}L ${entry.milk_type} दूध - ₹${entry.amount?.toFixed(0) || 0}`;
    
    return sendToCustomer(entry.customer_id, title, body, {
        type: 'milk_entry',
        entryId: String(entry.id),
        date: entry.date
    });
};

// Send payment notification
const sendPaymentNotification = async (payment, customerName) => {
    const title = '💰 Payment Received';
    const body = `₹${payment.amount} का payment मिला। धन्यवाद!`;
    
    return sendToCustomer(payment.customer_id, title, body, {
        type: 'payment',
        paymentId: String(payment.id),
        date: payment.date
    });
};

// Send broadcast notification to all customers
const sendBroadcast = async (title, body, data = {}) => {
    if (!initializeFirebase()) {
        return { success: false, reason: 'Firebase not initialized' };
    }

    try {
        const { data: allTokens, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('is_active', true);

        if (error) throw error;
        if (!allTokens || allTokens.length === 0) {
            return { success: false, reason: 'No active tokens' };
        }

        const tokens = allTokens.map(t => t.token);
        
        // FCM allows max 500 tokens per request
        const batchSize = 500;
        let totalSuccess = 0;
        let totalFailure = 0;

        for (let i = 0; i < tokens.length; i += batchSize) {
            const batch = tokens.slice(i, i + batchSize);
            const message = {
                notification: { title, body },
                data: { ...data, type: 'broadcast' },
                tokens: batch
            };

            const response = await admin.messaging().sendEachForMulticast(message);
            totalSuccess += response.successCount;
            totalFailure += response.failureCount;
        }

        console.log(`Broadcast sent: ${totalSuccess} success, ${totalFailure} failed`);
        return { success: true, successCount: totalSuccess, failureCount: totalFailure };
    } catch (error) {
        console.error('Error sending broadcast:', error);
        return { success: false, reason: error.message };
    }
};

module.exports = {
    initializeFirebase,
    registerToken,
    sendToCustomer,
    sendMilkEntryNotification,
    sendPaymentNotification,
    sendBroadcast
};
