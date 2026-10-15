import pool from '../../config/db.js';
import { verifyAuditLedgerIntegrity } from '../../services/audit/hashChain.js';

export const getRecordAuditHistory = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const query = `
      SELECT al.*, u.name as actor_name, u.email as actor_email
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.actor_id
      WHERE al.record_id = $1
      ORDER BY al.sequence_number ASC;
    `;
    const result = await pool.query(query, [recordId]);
    res.json({ success: true, count: result.rows.length, auditLogs: result.rows });
  } catch (error) {
    next(error);
  }
};

export const verifyFullLedgerChain = async (req, res, next) => {
  try {
    const query = 'SELECT * FROM audit_logs ORDER BY sequence_number ASC;';
    const result = await pool.query(query);
    const verification = verifyAuditLedgerIntegrity(result.rows);
    res.json({
      success: true,
      totalBlocks: result.rows.length,
      ...verification,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getRecordAuditHistory,
  verifyFullLedgerChain,
};
