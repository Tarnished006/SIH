import {
  loginUser,
  registerUser,
  refreshSession,
  logoutUser,
  logoutAllDevices,
  getActiveSessions,
} from './auth.service.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.connection?.remoteAddress || '';

    const result = await loginUser(email, password, { userAgent, ip });
    res.json({
      success: true,
      message: 'Authentication successful',
      ...result,
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name, role, department, stateLgd, districtLgd } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    }
    const user = await registerUser({ email, password, name, role, department, stateLgd, districtLgd });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken is required in request body' });
    }

    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.connection?.remoteAddress || '';

    const newTokens = await refreshSession(refreshToken, { userAgent, ip });
    res.json({
      success: true,
      message: 'Token rotated successfully',
      ...newTokens,
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res, next) => {
  try {
    await logoutUser(req.user.id, req.user.sessionId);
    res.json({ success: true, message: 'Logged out successfully; session revoked in Redis' });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    await logoutAllDevices(req.user.id);
    res.json({ success: true, message: 'All active sessions revoked across all devices' });
  } catch (error) {
    next(error);
  }
};

export const listSessions = async (req, res, next) => {
  try {
    const sessions = await getActiveSessions(req.user.id);
    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

export default {
  login,
  register,
  refresh,
  logout,
  logoutAll,
  listSessions,
  getProfile,
};
