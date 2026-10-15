import Redis from 'ioredis';
import { config } from './env.js';

let redisClient = null;

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('[REDIS] Connected successfully to Redis broker');
    });

    redisClient.on('error', (err) => {
      console.warn('[REDIS_WARNING] Redis connection error (background tasks may be queued in-memory if Redis is offline):', err.message);
    });
  }
  return redisClient;
};

export const redisConnection = {
  host: new URL(config.redisUrl).hostname || 'localhost',
  port: parseInt(new URL(config.redisUrl).port || '6379', 10),
};

export default getRedisClient;
