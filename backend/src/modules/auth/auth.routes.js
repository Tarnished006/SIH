import { Router } from 'express';
import {
  login,
  register,
  refresh,
  logout,
  logoutAll,
  listSessions,
  getProfile,
} from './auth.controller.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/refresh', refresh);

// User registration (Public for Citizen, Admin-controlled for Officials)
router.post('/register', optionalAuthenticateJWT, register);

// Protected session & profile endpoints
router.post('/logout', authenticateJWT, logout);
router.post('/logout-all', authenticateJWT, logoutAll);
router.get('/sessions', authenticateJWT, listSessions);
router.get('/profile', authenticateJWT, getProfile);

export default router;
