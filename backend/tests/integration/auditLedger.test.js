import {
  computeBlockHash,
  verifyAuditLedgerIntegrity,
  GENESIS_HASH,
} from '../../src/services/audit/hashChain.js';

describe('Tamper-Evident Audit Ledger (SHA-256 Hash Chaining)', () => {
  test('Produces deterministic hash for identical inputs', () => {
    const params = {
      prevHash: GENESIS_HASH,
      recordId: 'rec-123',
      actorId: 'user-456',
      action: 'FIELD_VERIFIED',
      delta: { field: 'area', value: '4.5' },
      timestamp: '2026-10-10T12:00:00.000Z',
    };

    const hash1 = computeBlockHash(params);
    const hash2 = computeBlockHash(params);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string
  });

  test('Verifies valid 3-block ledger chain successfully', () => {
    const timestamp1 = '2026-10-10T12:00:00.000Z';
    const delta1 = { event: 'Genesis' };
    const hash1 = computeBlockHash({
      prevHash: GENESIS_HASH,
      recordId: 'rec-1',
      actorId: 'sys',
      action: 'INIT',
      delta: delta1,
      timestamp: timestamp1,
    });

    const timestamp2 = '2026-10-10T12:05:00.000Z';
    const delta2 = { action: 'Patwari Accepted Field' };
    const hash2 = computeBlockHash({
      prevHash: hash1,
      recordId: 'rec-1',
      actorId: 'patwari-1',
      action: 'APPROVE',
      delta: delta2,
      timestamp: timestamp2,
    });

    const chain = [
      { sequence_number: 1, prev_hash: GENESIS_HASH, curr_hash: hash1, record_id: 'rec-1', actor_id: 'sys', action: 'INIT', delta: delta1, timestamp: timestamp1 },
      { sequence_number: 2, prev_hash: hash1, curr_hash: hash2, record_id: 'rec-1', actor_id: 'patwari-1', action: 'APPROVE', delta: delta2, timestamp: timestamp2 },
    ];

    const result = verifyAuditLedgerIntegrity(chain);
    expect(result.isTamperFree).toBe(true);
    expect(result.verifiedBlockCount).toBe(2);
  });

  test('Detects fraudulent tampering when block payload is modified after signing', () => {
    const timestamp1 = '2026-10-10T12:00:00.000Z';
    const originalDelta = { approvedArea: 4.5 };
    const hash1 = computeBlockHash({
      prevHash: GENESIS_HASH,
      recordId: 'rec-1',
      actorId: 'sys',
      action: 'INIT',
      delta: originalDelta,
      timestamp: timestamp1,
    });

    // An attacker alters the approved area in the database row to 14.5 without recomputing the cryptographic signature
    const tamperedChain = [
      {
        sequence_number: 1,
        prev_hash: GENESIS_HASH,
        curr_hash: hash1,
        record_id: 'rec-1',
        actor_id: 'sys',
        action: 'INIT',
        delta: { approvedArea: 14.5 }, // FORGED!
        timestamp: timestamp1,
      },
    ];

    const result = verifyAuditLedgerIntegrity(tamperedChain);
    expect(result.isTamperFree).toBe(false);
    expect(result.reason).toContain('tampered with');
  });
});
