const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the JWT sent in the Authorization header (Bearer token)
 * and attaches the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

/**
 * Restricts access to specific roles. Usage: authorize('admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires role(s): ${roles.join(', ')}`,
    });
  }
  next();
};

module.exports = { protect, authorize };
