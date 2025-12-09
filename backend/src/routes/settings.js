const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All settings routes require admin
router.get('/', authenticateToken, requireAdmin, settingsController.getAllSettings);
router.put('/', authenticateToken, requireAdmin, settingsController.updateSettings);

// Rate cards
router.get('/rate-cards', authenticateToken, requireAdmin, settingsController.getRateCards);
router.post('/rate-cards', authenticateToken, requireAdmin, settingsController.createRateCard);
router.put('/rate-cards/:id', authenticateToken, requireAdmin, settingsController.updateRateCard);
router.delete('/rate-cards/:id', authenticateToken, requireAdmin, settingsController.deleteRateCard);

// Password reset requests
router.get('/password-reset-requests', authenticateToken, requireAdmin, settingsController.getPasswordResetRequests);
router.put('/password-reset-requests/:id', authenticateToken, requireAdmin, settingsController.dismissPasswordResetRequest);

module.exports = router;

