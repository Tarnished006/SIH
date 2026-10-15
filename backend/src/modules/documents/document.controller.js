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
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getDocumentsList = async (req, res, next) => {
  try {
    const { limit, offset, status } = req.query;
    const docs = await listDocuments({
      limit: parseInt(limit || '20', 10),
      offset: parseInt(offset || '0', 10),
      status,
    });
    res.json({ success: true, count: docs.length, documents: docs });
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
};
