const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerPortalController');
const { authenticateToken } = require('../middleware/auth'); // We might need a separate middleware if generic auth is admin-only

// Middleware to check if user is customer
const authenticateCustomer = (req, res, next) => {
    // For now reusing generic middleware but verifying role
    authenticateToken(req, res, () => {
        if (req.user && req.user.role === 'customer') {
            next();
        } else {
            res.status(403).json({ error: 'Access denied: Customers only' });
        }
    });
};

/* Public Routes */
router.post('/auth/login', customerController.login);

/* Protected Routes */
router.use('/me', authenticateCustomer);

router.get('/me/summary', customerController.getDashboard);
router.get('/me/today-collection', customerController.getTodayCollection);
router.get('/me/last-days-collection', customerController.getLastDaysCollection);
router.get('/me/payments', customerController.getPayments);
router.get('/me/passbook', customerController.getPassbook);
router.get('/me/notifications', customerController.getNotifications);
router.get('/me/notifications/unread-count', customerController.getUnreadCount);
router.put('/me/notifications/:id/read', customerController.markNotificationRead);
router.put('/me/notifications/read-all', customerController.markAllNotificationsRead);
router.get('/me/profile', customerController.getProfile);

// News is public-ish but let's keep it behind auth for now or make it public
router.get('/news', authenticateCustomer, customerController.getNews);

module.exports = router;
