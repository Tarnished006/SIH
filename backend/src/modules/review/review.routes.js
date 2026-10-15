import { Router } from 'express';
import { getQueue, lockRecord, unlockRecord, submitDecision } from './review.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);

// Accessible by Revenue Officers (Patwari, Tehsildar, Admin)
router.get('/queue', requireRoles('PATWARI', 'TEHSILDAR', 'ADMIN'), getQueue);
router.post('/:recordId/lock', requireRoles('PATWARI', 'TEHSILDAR', 'ADMIN'), lockRecord);
router.post('/:recordId/unlock', requireRoles('PATWARI', 'TEHSILDAR', 'ADMIN'), unlockRecord);
router.post('/:recordId/submit', requireRoles('PATWARI', 'TEHSILDAR', 'ADMIN'), submitDecision);

export default router;
