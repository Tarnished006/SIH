import { Router } from 'express';
import {
  getQueue,
  lockRecord,
  unlockRecord,
  operatorSubmit,
  tehsildarDecision,
  submitDecision,
} from './review.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);

// Accessible by Patwari and Tehsildar
router.get('/queue', requireRoles('PATWARI', 'TEHSILDAR'), getQueue);
router.post('/:recordId/lock', requireRoles('PATWARI', 'TEHSILDAR'), lockRecord);
router.post('/:recordId/unlock', requireRoles('PATWARI', 'TEHSILDAR'), unlockRecord);

// Operator Submission (Patwari only)
router.post('/:recordId/operator-submit', requireRoles('PATWARI'), operatorSubmit);

// Tehsildar Verification Decision (Tehsildar only)
router.post('/:recordId/decision', requireRoles('TEHSILDAR'), tehsildarDecision);

// Workbench generic submission (strictly role-gated in controller)
router.post('/:recordId/submit', requireRoles('PATWARI', 'TEHSILDAR'), submitDecision);

export default router;
