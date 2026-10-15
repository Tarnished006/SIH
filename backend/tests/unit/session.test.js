import {
  createSession,
  rotateRefreshToken,
  isSessionActive,
  revokeSession,
  revokeAllUserSessions,
  listUserSessions,
} from '../../src/services/auth/session.service.js';

describe('Redis-based Session & Refresh Token Service', () => {
  const mockUser = {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'patwari.test@lucknow.gov.in',
    name: 'Test Patwari',
    role: 'PATWARI',
    department: 'Revenue Dept',
    stateLgdCode: '09',
    districtLgdCode: '140',
  };

  test('Creates dual tokens and active session', async () => {
    const session = await createSession(mockUser, {
      userAgent: 'Jest-Test-Agent/1.0',
      ip: '127.0.0.1',
    });

    expect(session.accessToken).toBeDefined();
    expect(session.refreshToken).toBeDefined();
    expect(session.sessionId).toBeDefined();
    expect(session.user.email).toBe(mockUser.email);

    const isActive = await isSessionActive(mockUser.id, session.sessionId);
    expect(isActive).toBe(true);
  });

  test('Rotates refresh token and issues a new access token', async () => {
    const session = await createSession(mockUser, {
      userAgent: 'Jest-Agent',
      ip: '127.0.0.1',
    });

    const rotated = await rotateRefreshToken(session.refreshToken, {
      userAgent: 'Jest-Agent-Updated',
      ip: '127.0.0.2',
    });

    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
    expect(rotated.refreshToken).not.toBe(session.refreshToken);

    // Old refresh token must now be invalid
    await expect(rotateRefreshToken(session.refreshToken)).rejects.toThrow();
  });

  test('Revokes single session on logout', async () => {
    const session = await createSession(mockUser, { ip: '10.0.0.1' });

    let active = await isSessionActive(mockUser.id, session.sessionId);
    expect(active).toBe(true);

    await revokeSession(mockUser.id, session.sessionId);

    active = await isSessionActive(mockUser.id, session.sessionId);
    expect(active).toBe(false);
  });

  test('Revokes all sessions for user across all devices', async () => {
    const session1 = await createSession(mockUser, { ip: '192.168.1.1' });
    const session2 = await createSession(mockUser, { ip: '192.168.1.2' });

    await revokeAllUserSessions(mockUser.id);

    const active1 = await isSessionActive(mockUser.id, session1.sessionId);
    const active2 = await isSessionActive(mockUser.id, session2.sessionId);

    expect(active1).toBe(false);
    expect(active2).toBe(false);
  });
});
