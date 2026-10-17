/**
 * Role-Based Access Control (RBAC) Middleware
 * Authorized Roles: TEHSILDAR, PATWARI, CITIZEN
 */

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthenticated',
        message: 'User authentication required before role evaluation.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Role "${req.user.role}" does not have required permissions: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

export default requireRoles;
