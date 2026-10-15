import { Router } from 'express';
import {
  uploadDocument,
  requestUploadSlot,
  finalizeUpload,
  getDocument,
  getDocumentsList,
} from './document.controller.js';
import { authenticateJWT } from '../../middleware/auth.middleware.js';
import { uploadSingleDocument } from '../../middleware/upload.middleware.js';

const router = Router();

router.use(authenticateJWT);

// Production Blueprint: Direct-to-S3 Presigned Flow (Zero Server RAM/CPU)
router.post('/request-upload', requestUploadSlot);
router.post('/:id/complete-upload', finalizeUpload);

// Fallback: Buffered upload through Express
router.post('/upload', uploadSingleDocument, uploadDocument);

router.get('/', getDocumentsList);
router.get('/:id', getDocument);

export default router;
