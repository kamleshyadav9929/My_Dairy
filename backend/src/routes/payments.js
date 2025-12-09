const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireAdmin, requireOwnData } = require('../middleware/auth');

// Admin routes
router.get('/', authenticateToken, requireAdmin, paymentController.getAllPayments);
router.post('/', authenticateToken, requireAdmin, paymentController.createPayment);
router.put('/:id', authenticateToken, requireAdmin, paymentController.updatePayment);
router.delete('/:id', authenticateToken, requireAdmin, paymentController.deletePayment);

// Customer-specific payments
router.get('/customer/:customerId', authenticateToken, requireOwnData, paymentController.getCustomerPayments);

module.exports = router;
