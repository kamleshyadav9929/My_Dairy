const express = require('express');
const router = express.Router();
const advanceController = require('../controllers/advanceController');
const { authenticateToken, requireAdmin, requireOwnData } = require('../middleware/auth');

// Admin routes
router.get('/', authenticateToken, requireAdmin, advanceController.getAllAdvances);
router.post('/', authenticateToken, requireAdmin, advanceController.createAdvance);
router.put('/:id', authenticateToken, requireAdmin, advanceController.updateAdvance);
router.delete('/:id', authenticateToken, requireAdmin, advanceController.deleteAdvance);

// Customer-specific balance
router.get('/customer/:customerId', authenticateToken, requireOwnData, advanceController.getCustomerAdvanceBalance);

module.exports = router;
