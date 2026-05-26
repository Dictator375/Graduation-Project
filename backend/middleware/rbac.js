// Role-based access control middleware
// Usage: router.get('/route', auth, rbac('manager'), handler)

function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        yours: req.user.role
      });
    }
    next();
  };
}

module.exports = rbac;
