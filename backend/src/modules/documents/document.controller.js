import {
  uploadAndEnqueueDocument,
  requestPresignedUpload,
  completePresignedUpload,
  getDocumentById,
  listDocuments,
} from './document.service.js';

/**
 * Standard buffered upload (Fallback)
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file uploaded. Field name must be "document".' });
    }

    const { stateLgd, districtLgd } = req.body;
    const result = await uploadAndEnqueueDocument({
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.id,
      uploadedByUser: {
        id: req.user?.id || 'citizen-demo',
        username: req.user?.username || (req.user?.email ? req.user.email.split('@')[0] : 'citizen'),
        name: req.user?.name || 'Citizen Landholder',
        email: req.user?.email || 'citizen@bhoomi.gov.in',
      },
      stateLgd: stateLgd || req.user?.stateLgd || '09',
      districtLgd: districtLgd || req.user?.districtLgd || '140',
    });

    res.status(202).json({
      success: true,
      message: result.isDuplicate ? 'Duplicate scan detected' : 'Document uploaded and processing enqueued',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PRODUCTION BLUEPRINT: Step 1 - Request Direct-to-S3 Upload Slot & Presigned URL
 */
export const requestUploadSlot = async (req, res, next) => {
  try {
    const { originalFilename, mimeType, fileSizeBytes, sha256Hash, stateLgd, districtLgd } = req.body;
    if (!originalFilename || !mimeType) {
      return res.status(400).json({ success: false, error: 'originalFilename and mimeType are required' });
    }

    const result = await requestPresignedUpload({
      originalFilename,
      mimeType,
      fileSizeBytes: fileSizeBytes || 0,
      sha256Hash,
      uploadedBy: req.user?.id,
      uploadedByUser: {
        id: req.user?.id || 'citizen-demo',
        username: req.user?.username || (req.user?.email ? req.user.email.split('@')[0] : 'citizen'),
        name: req.user?.name || 'Citizen Landholder',
        email: req.user?.email || 'citizen@bhoomi.gov.in',
      },
      stateLgd: stateLgd || req.user?.stateLgd || '09',
      districtLgd: districtLgd || req.user?.districtLgd || '140',
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PRODUCTION BLUEPRINT: Step 2 - Client notifies server that direct S3 upload completed
 */
export const finalizeUpload = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await completePresignedUpload(id, req.user?.id);
    res.json({
      success: true,
      message: 'Direct upload acknowledged; document processing enqueued to BullMQ worker',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const doc = await getDocumentById(req.params.id);
    if (req.user?.role === 'CITIZEN' && doc.uploadedById && doc.uploadedById !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied: You cannot view documents uploaded by other citizens.',
      });
    }
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getDocumentFile = async (req, res, next) => {
  try {
    const { getDocumentBufferLocally } = await import('../../services/storage/liveRecordStore.js');
    const local = getDocumentBufferLocally(req.params.id);
    if (local) {
      res.setHeader('Content-Type', local.mimeType || 'image/jpeg');
      res.setHeader('Content-Disposition', `inline; filename="${local.originalFilename}"`);
      return res.send(local.buffer);
    }

    const doc = await getDocumentById(req.params.id);
    const { getObjectBuffer } = await import('../../config/s3.js');
    const buffer = await getObjectBuffer(doc.s3Key);
    res.setHeader('Content-Type', doc.mimeType || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename}"`);
    return res.send(buffer);
  } catch (error) {
    res.status(404).json({ success: false, error: 'File content not found' });
  }
};

export const getDocumentsList = async (req, res, next) => {
  try {
    const { limit, offset, status } = req.query;
    // Citizens can ONLY view their own uploaded documents
    const uploadedByFilter = req.user?.role === 'CITIZEN' ? req.user.id : null;

    const docs = await listDocuments({
      limit: parseInt(limit || '20', 10),
      offset: parseInt(offset || '0', 10),
      status,
      uploadedById: uploadedByFilter,
    });
    res.json({ success: true, count: docs.length, documents: docs });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct Synchronous Document Analysis (Useful for testing & rapid inspection)
 */
export const analyzeDirect = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file uploaded. Field name must be "document".' });
    }

    const { preprocessScan } = await import('../../services/preprocessing/image.processor.js');
    const { extractLandRecord } = await import('../../services/ai/ai.service.js');
    const { convertLandArea } = await import('../../services/validation/unitConverter.js');
    const { runComprehensiveValidation } = await import('../../services/validation/rulesEngine.js');

    // 1. Sharp Preprocessing
    const preprocessed = await preprocessScan(req.file.buffer);

    // 2. AI Extraction (Vision LLM or Local Model)
    const aiResult = await extractLandRecord(preprocessed.processedBuffer, req.file.originalname, req.file.mimetype);
    const extracted = aiResult.extractedData;

    // 3. Multi-Region Land Unit Normalization
    const unitConversion = convertLandArea(
      extracted.rawArea,
      extracted.rawUnit,
      extracted.stateLgd || '09',
      extracted.districtLgd || '140'
    );

    // 4. Comprehensive Rule Validation
    const validation = runComprehensiveValidation({
      surveyNumber: extracted.surveyNumber,
      owners: extracted.owners,
      normalizedAreaSqm: unitConversion.normalizedAreaSqm,
      isAmbiguousUnit: unitConversion.isAmbiguous,
    });

    res.json({
      success: true,
      originalFilename: req.file.originalname,
      aiEngine: aiResult.engineUsed,
      mode: aiResult.mode,
      detectedLanguage: extracted.detectedLanguage,
      documentType: extracted.documentType,
      extractedData: {
        ...extracted,
        normalizedAreaSqm: unitConversion.normalizedAreaSqm,
        normalizedAreaHectares: unitConversion.normalizedAreaHectares,
        unitConversion,
      },
      validation,
      inferenceTimeMs: aiResult.totalTimeMs || aiResult.inferenceTimeMs,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadDocument,
  requestUploadSlot,
  finalizeUpload,
  getDocument,
  getDocumentsList,
  analyzeDirect,
};
