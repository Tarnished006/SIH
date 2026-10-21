import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import getRedisClient from '../../config/redis.js';
import { config } from '../../config/env.js';

/**
 * BhumiSetu Redis-based Session & Refresh Token Service
 * Enforces sliding sessions, token rotation, and single/multi-device revocation
 */

// In-memory fallback if Redis is unreachable in local mock mode
const inMemorySessions = new Map();
const inMemoryRefreshTokens = new Map();

const isRedisAvailable = async (redis) => {
  try {
    return redis && redis.status === 'ready';
  } catch {
    return false;
  }
};

/**
 * Creates a new authenticated session in Redis and issues dual tokens
 */
export const createSession = async (user, { userAgent = '', ip = '' } = {}) => {
  const redis = getRedisClient();
  const sessionId = crypto.randomUUID();
  const refreshToken = crypto.randomBytes(40).toString('hex');

  const tokenPayload = {
    id: user.id,
    sessionId,
    username: user.username || (user.email ? user.email.split('@')[0] : 'user'),
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    stateLgd: user.stateLgdCode || user.stateLgd,
    districtLgd: user.districtLgdCode || user.districtLgd,
  };

  // 1. Short-lived Access Token (15 min)
  const accessToken = jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiresIn,
  });

  const sessionData = {
    sessionId,
    username: user.username || (user.email ? user.email.split('@')[0] : 'user'),
    userId: user.id,
    email: user.email,
    role: user.role,
    userAgent,
    ip,
    createdAt: new Date().toISOString(),
    lastRefreshedAt: new Date().toISOString(),
  };

  const ttl = config.sessionTtlSeconds;

  try {
    if (await isRedisAvailable(redis)) {
      const pipeline = redis.pipeline();
      // Store session payload
      pipeline.set(`session:${user.id}:${sessionId}`, JSON.stringify(sessionData), 'EX', ttl);
      // Map refresh token to user + session
      pipeline.set(`refresh_token:${refreshToken}`, JSON.stringify({ userId: user.id, sessionId }), 'EX', ttl);
      // Track session in user's active session set
      pipeline.sadd(`user_sessions:${user.id}`, sessionId);
      pipeline.expire(`user_sessions:${user.id}`, ttl);
      await pipeline.exec();
    } else {
      // In-memory fallback
      inMemorySessions.set(`session:${user.id}:${sessionId}`, sessionData);
      inMemoryRefreshTokens.set(`refresh_token:${refreshToken}`, { userId: user.id, sessionId });
    }
  } catch (err) {
    console.warn('[REDIS_SESSION_WARN] Failed writing to Redis. Using in-memory fallback:', err.message);
    inMemorySessions.set(`session:${user.id}:${sessionId}`, sessionData);
    inMemoryRefreshTokens.set(`refresh_token:${refreshToken}`, { userId: user.id, sessionId });
  }

  return {
    accessToken,
    refreshToken,
    sessionId,
    username: user.username || (user.email ? user.email.split('@')[0] : 'user'),
    expiresIn: config.jwtAccessExpiresIn,
    user: tokenPayload,
  };
};

/**
 * Rotates refresh token and issues a new access token
 */
export const rotateRefreshToken = async (oldRefreshToken, { userAgent = '', ip = '' } = {}) => {
  if (!oldRefreshToken) {
    throw new Error('Refresh token is required');
  }

  const redis = getRedisClient();
  let mapping = null;

  try {
    if (await isRedisAvailable(redis)) {
      const raw = await redis.get(`refresh_token:${oldRefreshToken}`);
      if (raw) mapping = JSON.parse(raw);
    } else {
      mapping = inMemoryRefreshTokens.get(`refresh_token:${oldRefreshToken}`);
    }
  } catch (err) {
    mapping = inMemoryRefreshTokens.get(`refresh_token:${oldRefreshToken}`);
  }

  if (!mapping) {
    throw new Error('Invalid or expired refresh token. Please sign in again.');
  }

  const { userId, sessionId } = mapping;
  let session = null;

  try {
    if (await isRedisAvailable(redis)) {
      const rawSession = await redis.get(`session:${userId}:${sessionId}`);
      if (rawSession) session = JSON.parse(rawSession);
    } else {
      session = inMemorySessions.get(`session:${userId}:${sessionId}`);
    }
  } catch {
    session = inMemorySessions.get(`session:${userId}:${sessionId}`);
  }

  if (!session) {
    throw new Error('Session has expired or was revoked. Please log in again.');
  }

  // Generate new refresh token (Token Rotation prevents replay attacks)
  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenPayload = {
    id: session.userId,
    sessionId: session.sessionId,
    email: session.email,
    role: session.role,
  };

  const newAccessToken = jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiresIn,
  });

  const updatedSession = {
    ...session,
    ip: ip || session.ip,
    userAgent: userAgent || session.userAgent,
    lastRefreshedAt: new Date().toISOString(),
  };

  const ttl = config.sessionTtlSeconds;

  try {
    if (await isRedisAvailable(redis)) {
      const pipeline = redis.pipeline();
      pipeline.del(`refresh_token:${oldRefreshToken}`);
      pipeline.set(`refresh_token:${newRefreshToken}`, JSON.stringify({ userId, sessionId }), 'EX', ttl);
      pipeline.set(`session:${userId}:${sessionId}`, JSON.stringify(updatedSession), 'EX', ttl);
      await pipeline.exec();
    } else {
      inMemoryRefreshTokens.delete(`refresh_token:${oldRefreshToken}`);
      inMemoryRefreshTokens.set(`refresh_token:${newRefreshToken}`, { userId, sessionId });
      inMemorySessions.set(`session:${userId}:${sessionId}`, updatedSession);
    }
  } catch {
    inMemoryRefreshTokens.delete(`refresh_token:${oldRefreshToken}`);
    inMemoryRefreshTokens.set(`refresh_token:${newRefreshToken}`, { userId, sessionId });
    inMemorySessions.set(`session:${userId}:${sessionId}`, updatedSession);
  }

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: config.jwtAccessExpiresIn,
    user: tokenPayload,
  };
};

/**
 * Validates if an active session exists in Redis
 */
export const isSessionActive = async (userId, sessionId) => {
  if (!sessionId || !userId) return true; // legacy JWT compatibility

  const redis = getRedisClient();
  try {
    if (await isRedisAvailable(redis)) {
      const exists = await redis.exists(`session:${userId}:${sessionId}`);
      if (exists === 1) return true;
    }
    return inMemorySessions.has(`session:${userId}:${sessionId}`);
  } catch {
    return inMemorySessions.has(`session:${userId}:${sessionId}`);
  }
};

/**
 * Revokes a single session (Logout)
 */
export const revokeSession = async (userId, sessionId) => {
  const redis = getRedisClient();
  try {
    if (await isRedisAvailable(redis)) {
      await redis.del(`session:${userId}:${sessionId}`);
      await redis.srem(`user_sessions:${userId}`, sessionId);
    }
    inMemorySessions.delete(`session:${userId}:${sessionId}`);
  } catch (err) {
    inMemorySessions.delete(`session:${userId}:${sessionId}`);
  }
  return true;
};

/**
 * Revokes all sessions for a user across all devices (Security event / password reset)
 */
export const revokeAllUserSessions = async (userId) => {
  const redis = getRedisClient();
  try {
    if (await isRedisAvailable(redis)) {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);
      if (sessionIds && sessionIds.length > 0) {
        const keys = sessionIds.map((sid) => `session:${userId}:${sid}`);
        await redis.del(...keys);
      }
      await redis.del(`user_sessions:${userId}`);
    }
  } catch (err) {
    console.warn('[REDIS_REVOKE_ALL_WARN]', err.message);
  }

  // Clear matching in-memory keys
  for (const key of inMemorySessions.keys()) {
    if (key.startsWith(`session:${userId}:`)) {
      inMemorySessions.delete(key);
    }
  }
  return true;
};

/**
 * Lists active sessions for a user (IP, Device, Last Active)
 */
export const listUserSessions = async (userId) => {
  const redis = getRedisClient();
  const sessions = [];

  try {
    if (await isRedisAvailable(redis)) {
      const sessionIds = await redis.smembers(`user_sessions:${userId}`);
      for (const sid of sessionIds) {
        const raw = await redis.get(`session:${userId}:${sid}`);
        if (raw) sessions.push(JSON.parse(raw));
      }
      return sessions;
    }
  } catch (err) {
    console.warn('[REDIS_LIST_SESSIONS_WARN]', err.message);
  }

  for (const [key, value] of inMemorySessions.entries()) {
    if (key.startsWith(`session:${userId}:`)) {
      sessions.push(value);
    }
  }
  return sessions;
};

export default {
  createSession,
  rotateRefreshToken,
  isSessionActive,
  revokeSession,
  revokeAllUserSessions,
  listUserSessions,
};
