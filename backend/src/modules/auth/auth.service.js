import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma.js';
import {
  createSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
  listUserSessions,
} from '../../services/auth/session.service.js';

export const loginUser = async (email, password, { userAgent = '', ip = '' } = {}) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Create Redis session and dual tokens
  const session = await createSession(user, { userAgent, ip });

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    sessionId: session.sessionId,
    expiresIn: session.expiresIn,
    user: session.user,
  };
};

export const registerUser = async ({
  email,
  password,
  name,
  department,
  stateLgd,
  districtLgd,
}) => {
  if (!email || !password || !name) {
    throw new Error('Name, email, and password are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    throw new Error('User already exists with this email address');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Public registration ALWAYS creates a CITIZEN account regardless of any input
  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      passwordHash,
      name: name.trim(),
      role: 'CITIZEN',
      department: department || 'Citizen Services',
      stateLgdCode: stateLgd || '29', // Default Karnataka (29)
      districtLgdCode: districtLgd || '572',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      stateLgdCode: true,
      districtLgdCode: true,
      createdAt: true,
    },
  });

  return user;
};

export const refreshSession = async (refreshToken, reqMetadata = {}) => {
  return await rotateRefreshToken(refreshToken, reqMetadata);
};

export const logoutUser = async (userId, sessionId) => {
  return await revokeSession(userId, sessionId);
};

export const logoutAllDevices = async (userId) => {
  return await revokeAllUserSessions(userId);
};

export const getActiveSessions = async (userId) => {
  return await listUserSessions(userId);
};

export default {
  loginUser,
  registerUser,
  refreshSession,
  logoutUser,
  logoutAllDevices,
  getActiveSessions,
};
