import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[MIGRATION] Running initial schema migration...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'migrations', '001_initial_schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('[MIGRATION] Schema migration 001 complete.');

    console.log('[MIGRATION] Running workflow and remarks migration 002...');
    const schemaSql2 = fs.readFileSync(path.join(__dirname, 'migrations', '002_workflow_and_remarks.sql'), 'utf8');
    await client.query(schemaSql2);
    console.log('[MIGRATION] Schema migration 002 complete.');

    console.log('[MIGRATION] Running initial seeds...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seeds', '001_units_and_lgd.sql'), 'utf8');
    await client.query(seedSql);
    console.log('[MIGRATION] Seed data populated successfully.');
  } catch (err) {
    console.error('[MIGRATION_ERROR]', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('Migration process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
