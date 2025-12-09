const express = require('express');
const router = express.Router();
const amcuService = require('../services/amcuService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get AMCU status
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
    res.json(amcuService.getStatus());
});

// Get recent AMCU logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const logs = await amcuService.getRecentLogs(parseInt(limit));
        res.json({ logs });
    } catch (error) {
        console.error('AMCU logs error:', error);
        res.status(500).json({ error: 'Failed to get logs' });
    }
});

// Simulate AMCU entry (for testing without hardware)
router.post('/simulate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const entry = await amcuService.simulateEntry(req.body);
        res.json({ entry });
    } catch (error) {
        console.error('Simulation error:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
