import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multi-path dotenv resolution (supports running from repo root or backend folder)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Ensure process.env.DATABASE_URL is always defined so Prisma schema never throws
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://bhumisetu_user:bhumisetu_password@localhost:5432/bhumisetu_db';
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://bhumisetu_user:bhumisetu_password@localhost:5432/bhumisetu_db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // AI Engine Configuration (Dual Mode: 'LLM' | 'LOCAL_MODEL' | 'HYBRID' | 'MOCK')
  aiMode: (process.env.AI_MODE || 'LLM').toUpperCase(),
  hybridThreshold: parseFloat(process.env.HYBRID_CONFIDENCE_THRESHOLD || '0.70'),

  // Google Gemini Vision Intelligence
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',

  // Sarvam AI Sovereign Document Intelligence
  sarvamApiKey: process.env.SARVAM_API_KEY || '',
  aiProvider: (process.env.AI_PROVIDER || (process.env.SARVAM_API_KEY ? 'SARVAM' : 'GEMINI')).toUpperCase(),

  // Hugging Face AI Endpoints (Fine-Tuned Model)
  hfApiKey: process.env.HUGGINGFACE_API_KEY || '',
  hfEndpointUrl: process.env.HUGGINGFACE_ENDPOINT_URL || 'https://api-inference.huggingface.co/models/microsoft/trocr-base-stage1',
  useHfMock: process.env.USE_HF_MOCK === 'true',
  
  // S3 / MinIO Storage
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'bhumisetu-documents',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  },
  
  // Auth & Security
  jwtSecret: process.env.JWT_SECRET || 'bhumisetu-production-secret-key-change-this-in-prod-2026',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS || '604800', 10), // 7 days in seconds
};
