import prisma from '../config/prisma.js';

async function syncSequences() {
  try {
    console.log('[SYNC] Synchronizing PostgreSQL sequence values...');
    const result = await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('audit_logs', 'sequence_number'),
        COALESCE((SELECT MAX(sequence_number) FROM audit_logs), 0) + 1,
        false
      );
    `);
    console.log('[SYNC] Successfully aligned audit_logs sequence.');
    process.exit(0);
  } catch (err) {
    console.error('[SYNC_ERROR]', err);
    process.exit(1);
  }
}

syncSequences();
