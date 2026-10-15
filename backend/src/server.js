import app from './app.js';
import { config } from './config/env.js';
import pool from './config/db.js';

const server = app.listen(config.port, () => {
  console.log('================================================================');
  console.log(`🚀 BhumiSetu Backend Service Running on http://localhost:${config.port}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🤖 AI Engine Mode: ${config.aiMode} (${config.aiMode === 'LLM' ? config.geminiModel : config.hfEndpointUrl})`);
  console.log(`🗺️ PostGIS Database URL: ${config.databaseUrl}`);
  console.log('================================================================');
});

const gracefulShutdown = (signal) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed.');
    try {
      await pool.end();
      console.log('[SHUTDOWN] Database pool closed.');
    } catch (err) {
      console.error('[SHUTDOWN_ERROR] Error closing pool:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
