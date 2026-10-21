import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

import { config } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import recordRoutes from './modules/records/record.routes.js';
import reviewRoutes from './modules/review/review.routes.js';
import gisRoutes from './modules/gis/gis.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

const app = express();

// Security & utility middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'UP',
    project: 'BhumiSetu Backend (SIH PS 26018)',
    environment: config.nodeEnv,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    aiMode: config.useHfMock ? 'MOCK_INFERENCE' : 'HUGGINGFACE_REMOTE_ENDPOINT',
    hfEndpoint: config.hfEndpointUrl,
  });
});

// Raw file streaming endpoint for local dev / S3 fallback
app.get('/api/v1/documents/raw/:key', (req, res) => {
  const filePath = path.join(process.cwd(), 'uploads', path.basename(req.params.key));
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).json({ success: false, error: 'File not found' });
});

// Mount modular API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/gis', gisRoutes);
app.use('/api/v1/audit', auditRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
