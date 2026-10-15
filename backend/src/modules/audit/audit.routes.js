import { Router } from 'express';
import { getRecordAuditHistory, verifyFullLedgerChain } from './audit.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/record/:recordId', getRecordAuditHistory);
router.get('/verify-chain', requireRoles('ADMIN', 'TEHSILDAR'), verifyFullLedgerChain);

export default router;
