const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, requireAdmin, requireOwnData } = require('../middleware/auth');

// Admin routes
router.get('/', authenticateToken, requireAdmin, customerController.getAllCustomers);
router.post('/', authenticateToken, requireAdmin, customerController.createCustomer);
router.get('/:id', authenticateToken, requireOwnData, customerController.getCustomerById);
router.put('/:id', authenticateToken, requireAdmin, customerController.updateCustomer);
router.delete('/:id', authenticateToken, requireAdmin, customerController.deleteCustomer);

// Customer data routes (accessible by customer themselves or admin)
router.get('/:id/summary', authenticateToken, requireOwnData, customerController.getCustomerSummary);
router.get('/:id/passbook', authenticateToken, requireOwnData, customerController.getCustomerPassbook);

module.exports = router;
