import { Router } from 'express';
import { getRecord, findRecords } from './record.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/', findRecords);
router.get('/:id', getRecord);

export default router;
