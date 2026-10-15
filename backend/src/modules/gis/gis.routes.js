import { Router } from 'express';
import {
  analyzePolygon,
  verifyOverlap,
  attachParcelGeometry,
  getVillageMapData,
} from './gis.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateJWT);

router.post('/analyze-polygon', analyzePolygon);
router.post('/check-overlap', verifyOverlap);
router.post('/parcel/:recordId', attachParcelGeometry);
router.get('/village/:villageLgd', getVillageMapData);

export default router;
