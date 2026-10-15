import crypto from 'crypto';
import prisma from '../../config/prisma.js';

/**
 * BhumiSetu Tamper-Evident Audit Ledger (Prisma ORM Edition)
 * Cryptographic SHA-256 hash chaining for land record modifications & human verifications
 */

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes canonical deterministic SHA-256 hash for an audit block
 */
export const computeBlockHash = ({
  prevHash = GENESIS_HASH,
  recordId = '',
  actorId = '',
  action = '',
  delta = {},
  timestamp = '',
}) => {
  // Sort keys in JSON delta to guarantee deterministic stringification
  const canonicalDelta = JSON.stringify(delta, Object.keys(delta).sort());
  const inputString = `${prevHash}|${recordId}|${actorId}|${action}|${canonicalDelta}|${timestamp}`;
  return crypto.createHash('sha256').update(inputString).digest('hex');
};

/**
 * Appends a new immutable block to the audit ledger using Prisma
 */
export const appendAuditLog = async ({
  recordId,
  actorId,
  actorRole = 'PATWARI',
  action,
  delta,
  tx = null, // optional Prisma transaction client
}) => {
  const db = tx || prisma;

  // 1. Fetch latest block hash
  const latestBlock = await db.auditLog.findFirst({
    orderBy: { sequenceNumber: 'desc' },
    select: { currHash: true },
  });

  const prevHash = latestBlock?.currHash || GENESIS_HASH;
  const timestamp = new Date().toISOString();

  // 2. Compute cryptographic hash
  const currHash = computeBlockHash({
    prevHash,
    recordId: recordId || '',
    actorId: actorId || '',
    action,
    delta,
    timestamp,
  });

  // 3. Insert block via Prisma
  const block = await db.auditLog.create({
    data: {
      recordId: recordId || null,
      action,
      actorId: actorId || null,
      actorRole,
      prevHash,
      currHash,
      delta,
      timestamp: new Date(timestamp),
    },
    select: {
      id: true,
      sequenceNumber: true,
      prevHash: true,
      currHash: true,
      timestamp: true,
    },
  });

  return {
    ...block,
    sequenceNumber: Number(block.sequenceNumber),
  };
};

/**
 * Verifies the mathematical integrity of the entire audit chain
 */
export const verifyAuditLedgerIntegrity = (auditRows = []) => {
  if (!auditRows || auditRows.length === 0) {
    return { isTamperFree: true, message: 'Ledger is empty.' };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < auditRows.length; i++) {
    const row = auditRows[i];

    const prevHash = row.prev_hash || row.prevHash;
    const currHash = row.curr_hash || row.currHash;
    const sequenceNumber = Number(row.sequence_number || row.sequenceNumber);
    const recordId = row.record_id || row.recordId;
    const actorId = row.actor_id || row.actorId;
    const action = row.action;
    const delta = typeof row.delta === 'string' ? JSON.parse(row.delta) : row.delta;
    const timestamp = new Date(row.timestamp).toISOString();

    if (i === 0 && prevHash !== GENESIS_HASH) {
      return {
        isTamperFree: false,
        invalidSequence: sequenceNumber,
        reason: 'Genesis block prev_hash does not match GENESIS_HASH',
      };
    }

    if (i > 0 && prevHash !== expectedPrevHash) {
      return {
        isTamperFree: false,
        invalidSequence: sequenceNumber,
        reason: `Broken chain link at sequence ${sequenceNumber}. Expected prev_hash ${expectedPrevHash}, found ${prevHash}`,
      };
    }

    const recomputedHash = computeBlockHash({
      prevHash,
      recordId: recordId || '',
      actorId: actorId || '',
      action,
      delta,
      timestamp,
    });

    if (recomputedHash !== currHash) {
      return {
        isTamperFree: false,
        invalidSequence: sequenceNumber,
        reason: `Hash mismatch at sequence ${sequenceNumber}. Block payload has been tampered with!`,
      };
    }

    expectedPrevHash = currHash;
  }

  return { isTamperFree: true, verifiedBlockCount: auditRows.length };
};

export default {
  computeBlockHash,
  appendAuditLog,
  verifyAuditLedgerIntegrity,
  GENESIS_HASH,
};
