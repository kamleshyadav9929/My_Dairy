require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const entryRoutes = require('./routes/entries');
const paymentRoutes = require('./routes/payments');
const advanceRoutes = require('./routes/advances');
const settingsRoutes = require('./routes/settings');
const amcuRoutes = require('./routes/amcu');
const customerPortalRoutes = require('./routes/customerRoutes');
const notificationRoutes = require('./routes/notifications');

// Import services
const amcuService = require('./services/amcuService');
const notificationService = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'supabase',
        amcu: amcuService.getStatus()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes); // Admin management
app.use('/api/entries', entryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/amcu', amcuRoutes);
app.use('/api/customer', customerPortalRoutes); // Customer Portal
app.use('/api/notifications', notificationRoutes); // Push Notifications

// SSE endpoint for real-time AMCU updates
const clients = new Set();

app.get('/api/amcu/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.add(res);

    req.on('close', () => {
        clients.delete(res);
    });
});

// Broadcast AMCU events to all SSE clients
amcuService.events.on('entry', (entry) => {
    const data = JSON.stringify({ type: 'entry', data: entry });
    clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
    });
});

amcuService.events.on('status', (status) => {
    const data = JSON.stringify({ type: 'status', data: status });
    clients.forEach(client => {
        client.write(`data: ${data}\n\n`);
    });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
    console.log('Starting server with Supabase database...');

    // Initialize AMCU service
    await amcuService.initialize();

    app.listen(PORT, () => {
        console.log(`🥛 Dairy Management Server running on port ${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/api/health`);
        console.log(`   Database: Supabase`);
        console.log(`   AMCU Status: ${amcuService.getStatus().enabled ? 'Enabled' : 'Disabled'}`);
    });
}

start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    amcuService.close();
    process.exit(0);
});
