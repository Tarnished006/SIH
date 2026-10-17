import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import { uploadBuffer, getPresignedDownloadUrl, getPresignedUploadUrl } from '../../config/s3.js';
import { enqueueDocumentProcessing } from '../../workers/document.queue.js';

/**
 * Standard Upload (Buffered through API server) - Useful for local dev / small scans
 */
export const uploadAndEnqueueDocument = async ({
  fileBuffer,
  originalFilename,
  mimeType,
  uploadedBy,
  stateLgd = '09',
  districtLgd = '140',
}) => {
  // 1. Calculate SHA-256 hash for deduplication
  const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // 2. Check for duplicate scan using Prisma
  const existing = await prisma.document.findUnique({
    where: { sha256Hash },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      createdAt: true,
    },
  });

  if (existing) {
    return {
      isDuplicate: true,
      message: 'This document scan has already been uploaded previously.',
      document: existing,
    };
  }

  // 3. Save raw file to S3/MinIO
  const fileExtension = originalFilename.split('.').pop() || 'jpg';
  const s3Key = `raw/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${fileExtension}`;
  await uploadBuffer(s3Key, fileBuffer, mimeType);

  // 4. Create document row via Prisma
  const document = await prisma.document.create({
    data: {
      originalFilename,
      mimeType,
      fileSizeBytes: BigInt(fileBuffer.length),
      sha256Hash,
      s3Key,
      status: 'UPLOADED',
      uploadedById: uploadedBy || null,
      metadata: { stateLgd, districtLgd },
    },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      createdAt: true,
    },
  });

  // 5. Enqueue background processing job
  const enqueueResult = await enqueueDocumentProcessing({
    documentId: document.id,
    s3Key,
    originalFilename,
    uploadedBy,
    stateLgd,
    districtLgd,
  });

  return {
    isDuplicate: false,
    document,
    queueStatus: enqueueResult,
  };
};

/**
 * PRODUCTION BLUEPRINT: Request Presigned Direct-to-S3 Upload URL
 * Zero-memory footprint on Node.js API server
 */
export const requestPresignedUpload = async ({
  originalFilename,
  mimeType,
  fileSizeBytes = 0,
  sha256Hash,
  uploadedBy,
  stateLgd = '09',
  districtLgd = '140',
}) => {
  // Instant deduplication check before any bytes are transmitted
  if (sha256Hash) {
    const existing = await prisma.document.findUnique({
      where: { sha256Hash },
      select: { id: true, originalFilename: true, status: true, createdAt: true },
    });
    if (existing) {
      return {
        isDuplicate: true,
        message: 'This document scan has already been uploaded previously.',
        document: existing,
      };
    }
  }

  const fileExtension = originalFilename.split('.').pop() || 'jpg';
  const s3Key = `raw/${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${fileExtension}`;
  const presignedUploadUrl = await getPresignedUploadUrl(s3Key, mimeType, 900); // 15 min expiration

  const document = await prisma.document.create({
    data: {
      originalFilename,
      mimeType,
      fileSizeBytes: BigInt(fileSizeBytes),
      sha256Hash: sha256Hash || crypto.randomBytes(32).toString('hex'),
      s3Key,
      status: 'UPLOADED',
      uploadedById: uploadedBy || null,
      metadata: { stateLgd, districtLgd },
    },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    isDuplicate: false,
    document,
    s3Key,
    presignedUploadUrl,
    uploadMethod: 'PUT',
    uploadHeaders: {
      'Content-Type': mimeType,
    },
  };
};

/**
 * PRODUCTION BLUEPRINT: Trigger background processing once direct S3 upload is finished
 */
export const completePresignedUpload = async (documentId, uploadedBy) => {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });
  if (!doc) {
    throw new Error('Document not found');
  }

  const meta = doc.metadata || {};
  const enqueueResult = await enqueueDocumentProcessing({
    documentId: doc.id,
    s3Key: doc.s3Key,
    originalFilename: doc.originalFilename,
    uploadedBy,
    stateLgd: meta.stateLgd || '09',
    districtLgd: meta.districtLgd || '140',
  });

  return {
    success: true,
    documentId: doc.id,
    queueStatus: enqueueResult,
  };
};

export const getDocumentById = async (documentId) => {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      landRecords: {
        select: {
          id: true,
          surveyNumber: true,
          reviewStatus: true,
          reviewPriorityScore: true,
        },
      },
    },
  });

  if (!doc) {
    throw new Error('Document not found');
  }

  const downloadUrl = await getPresignedDownloadUrl(doc.s3Key);
  const preprocessedUrl = doc.preprocessedS3Key ? await getPresignedDownloadUrl(doc.preprocessedS3Key) : null;

  return {
    ...doc,
    fileSizeBytes: Number(doc.fileSizeBytes),
    downloadUrl,
    preprocessedUrl,
  };
};

export const listDocuments = async ({ limit = 20, offset = 0, status = null, uploadedById = null }) => {
  const where = {};
  if (status) where.status = status;
  if (uploadedById) where.uploadedById = uploadedById;

  const docs = await prisma.document.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
  });

  return docs.map((doc) => ({
    ...doc,
    fileSizeBytes: Number(doc.fileSizeBytes),
  }));
};

export default {
  uploadAndEnqueueDocument,
  requestPresignedUpload,
  completePresignedUpload,
  getDocumentById,
  listDocuments,
};
