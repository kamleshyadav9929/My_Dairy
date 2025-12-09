const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.post('/admin/login', authController.adminLogin);
router.post('/customer/login', authController.customerLogin);
router.post('/request-reset', authController.requestPasswordReset); // Forgot password

// Protected routes
router.get('/me', authenticateToken, authController.getMe);
router.post('/change-password', authenticateToken, authController.changePassword); // Works for both admin and customer
router.post('/admin/reset-customer-password', authenticateToken, requireAdmin, authController.adminResetCustomerPassword);

module.exports = router;

