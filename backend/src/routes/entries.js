const express = require('express');
const router = express.Router();
const entryController = require('../controllers/entryController');
const { authenticateToken, requireAdmin, requireOwnData } = require('../middleware/auth');

// Admin routes
router.get('/', authenticateToken, requireAdmin, entryController.getAllEntries);
router.get('/today', authenticateToken, requireAdmin, entryController.getTodayStats);
router.post('/', authenticateToken, requireAdmin, entryController.createEntry);
router.put('/:id', authenticateToken, requireAdmin, entryController.updateEntry);
router.delete('/:id', authenticateToken, requireAdmin, entryController.deleteEntry);

// Export routes
router.get('/export/csv', authenticateToken, requireAdmin, entryController.exportCSV);
router.get('/export/pdf', authenticateToken, requireAdmin, entryController.exportDailyPDF);

// Customer-specific entries (accessible by customer themselves)
router.get('/customer/:customerId', authenticateToken, requireOwnData, entryController.getCustomerEntries);

module.exports = router;
