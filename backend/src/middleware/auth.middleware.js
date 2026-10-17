import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { isSessionActive } from '../services/auth/session.service.js';

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token missing or invalid format. Expected "Bearer <token>"',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Verify session liveness in Redis
    if (decoded.sessionId) {
      const active = await isSessionActive(decoded.id, decoded.sessionId);
      if (!active) {
        return res.status(401).json({
          success: false,
          error: 'SessionRevoked',
          message: 'This session has been logged out or revoked. Please log in again.',
        });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: err.message,
    });
  }
};

export const optionalAuthenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch (err) {
    // Silently ignore invalid token on optional endpoints
  }
  next();
};

export default authenticateJWT;
