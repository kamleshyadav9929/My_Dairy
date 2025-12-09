const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

/**
 * Verify JWT token middleware
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Check if user is admin
 */
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

/**
 * Check if user is customer (and can only access their own data)
 */
function requireCustomer(req, res, next) {
    if (req.user.role !== 'customer') {
        return res.status(403).json({ error: 'Customer access required' });
    }
    next();
}

/**
 * Ensure customer can only access their own data
 */
function requireOwnData(req, res, next) {
    const requestedCustomerId = parseInt(req.params.customerId || req.params.id);
    
    // Admins can access any customer's data
    if (req.user.role === 'admin') {
        return next();
    }
    
    // Customers can only access their own data
    if (req.user.role === 'customer' && req.user.customerId === requestedCustomerId) {
        return next();
    }
    
    return res.status(403).json({ error: 'Access denied' });
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
}

module.exports = {
    authenticateToken,
    requireAdmin,
    requireCustomer,
    requireOwnData,
    generateToken
};
