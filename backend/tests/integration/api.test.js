import request from 'supertest';
import app from '../../src/app.js';
import { createSession } from '../../src/services/auth/session.service.js';

describe('Comprehensive API Route Test Suite (All Endpoints & RBAC)', () => {
  let adminToken;
  let patwariToken;
  let citizenToken;

  beforeAll(async () => {
    const adminSession = await createSession({
      id: '00000000-1111-2222-3333-444444444441',
      email: 'admin@gov.in',
      name: 'Admin User',
      role: 'ADMIN',
      department: 'Revenue',
      stateLgdCode: '09',
      districtLgdCode: '140',
    });
    adminToken = adminSession.accessToken;

    const patwariSession = await createSession({
      id: '00000000-1111-2222-3333-444444444442',
      email: 'patwari@gov.in',
      name: 'Patwari User',
      role: 'PATWARI',
      department: 'Revenue',
      stateLgdCode: '09',
      districtLgdCode: '140',
    });
    patwariToken = patwariSession.accessToken;

    const citizenSession = await createSession({
      id: '00000000-1111-2222-3333-444444444443',
      email: 'citizen@gov.in',
      name: 'Citizen User',
      role: 'CITIZEN',
      department: 'Public',
      stateLgdCode: '09',
      districtLgdCode: '140',
    });
    citizenToken = citizenSession.accessToken;
  });

  // Sample GeoJSON Polygon in Lucknow for GIS tests
  const samplePolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [80.9400, 26.8400],
        [80.9410, 26.8400],
        [80.9410, 26.8409],
        [80.9400, 26.8409],
        [80.9400, 26.8400],
      ],
    ],
  };

  // 1. Health Endpoint
  describe('Health Check Endpoint', () => {
    test('GET /api/v1/health returns status UP and service metadata', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.project).toContain('BhumiSetu');
      expect(res.body.aiMode).toBeDefined();
    });
  });

  // 2. Auth Routes
  describe('Authentication & Session Routes', () => {
    test('POST /api/v1/auth/login validates required fields', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/auth/refresh rejects missing token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/auth/refresh rejects invalid or forged refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'fake-invalid-token-12345' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/v1/auth/profile returns user info with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${patwariToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('PATWARI');
    });

    test('POST /api/v1/auth/logout revokes session with valid token', async () => {
      // Use dedicated session so we don't invalidate patwariToken for other tests
      const logoutSession = await createSession({
        id: '00000000-1111-2222-3333-444444444442',
        email: 'patwari@gov.in',
        role: 'PATWARI',
      });
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${logoutSession.accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('GET /api/v1/auth/sessions returns active sessions list', async () => {
      const res = await request(app)
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${patwariToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('POST /api/v1/auth/register requires ADMIN role (403 for non-admin)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${patwariToken}`)
        .send({ email: 'new@gov.in', password: 'Pass', name: 'New' });
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  // 3. Document Routes
  describe('Document Ingestion Routes', () => {
    test('POST /api/v1/documents/request-upload rejects unauthenticated calls', async () => {
      const res = await request(app).post('/api/v1/documents/request-upload').send({});
      expect(res.statusCode).toBe(401);
    });

    test('POST /api/v1/documents/request-upload validates missing filename', async () => {
      const res = await request(app)
        .post('/api/v1/documents/request-upload')
        .set('Authorization', `Bearer ${patwariToken}`)
        .send({ mimeType: 'image/jpeg' });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/documents/upload rejects request without file', async () => {
      const res = await request(app)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${patwariToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('No document file uploaded');
    });

    test('GET /api/v1/documents requires auth token', async () => {
      const res = await request(app).get('/api/v1/documents');
      expect(res.statusCode).toBe(401);
    });
  });

  // 4. Land Records Search Routes
  describe('Land Records Routes', () => {
    test('GET /api/v1/records requires auth token', async () => {
      const res = await request(app).get('/api/v1/records');
      expect(res.statusCode).toBe(401);
    });

    test('GET /api/v1/records/:id requires auth token', async () => {
      const res = await request(app).get('/api/v1/records/00000000-0000-0000-0000-000000000001');
      expect(res.statusCode).toBe(401);
    });
  });

  // 5. Human-in-the-Loop Review Routes & RBAC
  describe('Review Queue & HITL Governance Routes', () => {
    test('GET /api/v1/review/queue rejects unauthenticated users', async () => {
      const res = await request(app).get('/api/v1/review/queue');
      expect(res.statusCode).toBe(401);
    });

    test('GET /api/v1/review/queue denies CITIZEN role (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/review/queue')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    test('POST /api/v1/review/:id/lock denies CITIZEN role (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/review/some-record-id/lock')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('POST /api/v1/review/:id/submit denies CITIZEN role (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/review/some-record-id/submit')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // 6. GIS & Spatial Topology Routes
  describe('GIS & Spatial Geometry Routes', () => {
    test('POST /api/v1/gis/analyze-polygon requires authentication', async () => {
      const res = await request(app).post('/api/v1/gis/analyze-polygon').send({ geometry: samplePolygon });
      expect(res.statusCode).toBe(401);
    });

    test('POST /api/v1/gis/analyze-polygon validates and computes geodesic area with valid token', async () => {
      const res = await request(app)
        .post('/api/v1/gis/analyze-polygon')
        .set('Authorization', `Bearer ${patwariToken}`)
        .send({ geometry: samplePolygon });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analysis.isValid).toBe(true);
      expect(res.body.analysis.kinkCount).toBe(0);
      expect(res.body.analysis.calculatedAreaSqm).toBeGreaterThan(9000);
    });

    test('POST /api/v1/gis/check-overlap detects parcel boundary collision', async () => {
      const overlapping = {
        type: 'Polygon',
        coordinates: [
          [
            [80.9405, 26.8405],
            [80.9415, 26.8405],
            [80.9415, 26.8415],
            [80.9405, 26.8415],
            [80.9405, 26.8405],
          ],
        ],
      };

      const res = await request(app)
        .post('/api/v1/gis/check-overlap')
        .set('Authorization', `Bearer ${patwariToken}`)
        .send({ poly1: samplePolygon, poly2: overlapping });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.doesOverlap).toBe(true);
      expect(res.body.hasEncroachment).toBe(true);
    });
  });

  // 7. Audit Ledger Routes
  describe('Tamper-Evident Audit Routes', () => {
    test('GET /api/v1/audit/record/:id requires authentication', async () => {
      const res = await request(app).get('/api/v1/audit/record/123');
      expect(res.statusCode).toBe(401);
    });

    test('GET /api/v1/audit/verify-chain denies PATWARI role (403 - Admin/Tehsildar only)', async () => {
      const res = await request(app)
        .get('/api/v1/audit/verify-chain')
        .set('Authorization', `Bearer ${patwariToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // 8. Error / 404 Route
  describe('Route Not Found Handler', () => {
    test('Returns 404 for undefined routes', async () => {
      const res = await request(app).get('/api/v1/non-existent-route-xyz');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('NotFound');
    });
  });
});
