import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[POSTGRES_POOL_ERROR] Unexpected error on idle client', err.message);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 500) {
      console.warn(`[SLOW_QUERY] ${duration}ms: ${text}`);
    }
    return res;
  } catch (error) {
    console.error(`[DB_QUERY_ERROR] Query: "${text}" - Message: ${error.message}`);
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};

export default pool;
