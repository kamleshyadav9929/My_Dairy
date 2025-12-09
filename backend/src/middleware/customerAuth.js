const jwt = require('jsonwebtoken');

/**
 * Verify customer JWT token middleware
 * Sets req.customer with the decoded token data
 */
function verifyCustomerToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Ensure this is a customer token
        if (decoded.role !== 'customer') {
            return res.status(403).json({ error: 'Customer access required' });
        }
        
        req.customer = {
            id: decoded.id,
            name: decoded.name,
            role: decoded.role
        };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

module.exports = verifyCustomerToken;
