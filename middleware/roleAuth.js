const { auth } = require('./auth');

const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      await new Promise((resolve, reject) => {
        auth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
      }

      next();

    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in role authorization'
      });
    }
  };
};

const adminOnly = authorize('admin');

const customerOnly = authorize('customer');

module.exports = {
  authorize,
  adminOnly,
  customerOnly
};