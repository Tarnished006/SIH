import prisma from '../../config/prisma.js';
import { appendAuditLog } from '../../services/audit/hashChain.js';
import { convertLandArea } from '../../services/validation/unitConverter.js';

export const fetchReviewQueue = async ({ villageLgd = null, limit = 20, offset = 0 }) => {
  const where = {
    reviewStatus: { in: ['PENDING_REVIEW', 'IN_REVIEW'] },
  };

  if (villageLgd) {
    where.villageLgd = villageLgd;
  }

  const queue = await prisma.landRecord.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [{ reviewPriorityScore: 'desc' }, { createdAt: 'asc' }],
    include: {
      document: {
        select: {
          originalFilename: true,
        },
      },
    },
  });

  return queue;
};

export const acquireReviewLock = async (recordId, userId) => {
  const record = await prisma.landRecord.findUnique({
    where: { id: recordId },
    select: { lockedById: true, lockedAt: true, reviewStatus: true },
  });

  if (!record) {
    throw new Error('Record not found');
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  if (record.lockedById && record.lockedById !== userId && record.lockedAt && record.lockedAt > fifteenMinutesAgo) {
    throw new Error('Record is currently locked by another revenue officer for review.');
  }

  const updated = await prisma.landRecord.update({
    where: { id: recordId },
    data: {
      lockedById: userId,
      lockedAt: new Date(),
      reviewStatus: 'IN_REVIEW',
    },
    select: {
      id: true,
      lockedById: true,
      lockedAt: true,
    },
  });

  return { success: true, recordId, lockedBy: updated.lockedById, lockedAt: updated.lockedAt };
};

export const releaseReviewLock = async (recordId, userId) => {
  await prisma.landRecord.updateMany({
    where: { id: recordId, lockedById: userId },
    data: {
      lockedById: null,
      lockedAt: null,
      reviewStatus: 'PENDING_REVIEW',
    },
  });
  return { success: true, message: 'Review lock released' };
};

export const submitReviewDecision = async ({
  recordId,
  reviewerId,
  reviewerRole = 'PATWARI',
  fieldDecisions = [], // [{ fieldId, status: 'ACCEPTED'|'CORRECTED'|'REJECTED', verifiedValue, reason }]
  finalStatus = 'VERIFIED',
  notes = '',
  manualArea = null,
}) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current record
    const record = await tx.landRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) {
      throw new Error('Land record not found');
    }

    // 2. Update each field decision in fieldExtractions
    const fieldDeltas = [];
    for (const decision of fieldDecisions) {
      const updatedField = await tx.fieldExtraction.update({
        where: { id: decision.fieldId },
        data: {
          humanVerifiedValue: decision.verifiedValue || null,
          status: decision.status,
          correctionReason: decision.reason || null,
        },
        select: {
          fieldName: true,
          aiExtractedValue: true,
          humanVerifiedValue: true,
          status: true,
        },
      });
      fieldDeltas.push(updatedField);
    }

    // 3. Area recalculation if adjusted
    let updatedSqm = record.normalizedAreaSqm;
    let updatedHectares = record.normalizedAreaHectares;
    let updatedRawArea = record.rawArea;
    let updatedRawUnit = record.rawUnit;

    if (manualArea?.rawValue && manualArea?.rawUnit) {
      const conv = convertLandArea(manualArea.rawValue, manualArea.rawUnit, record.stateLgd, record.districtLgd);
      updatedSqm = conv.normalizedAreaSqm;
      updatedHectares = conv.normalizedAreaHectares;
      updatedRawArea = conv.rawValue;
      updatedRawUnit = conv.rawUnit;
    }

    // 4. Update land record to final status
    const updatedRecord = await tx.landRecord.update({
      where: { id: recordId },
      data: {
        reviewStatus: finalStatus,
        verifiedById: reviewerId,
        verifiedAt: new Date(),
        lockedById: null,
        lockedAt: null,
        rawArea: updatedRawArea,
        rawUnit: updatedRawUnit,
        normalizedAreaSqm: updatedSqm,
        normalizedAreaHectares: updatedHectares,
      },
    });

    // 5. Append tamper-evident block to audit ledger
    const auditBlock = await appendAuditLog({
      recordId,
      actorId: reviewerId,
      actorRole: reviewerRole,
      action: finalStatus === 'VERIFIED' ? 'HUMAN_VERIFIED_AND_APPROVED' : 'HUMAN_REJECTED',
      delta: {
        previousReviewStatus: record.reviewStatus,
        finalStatus,
        notes,
        fieldChanges: fieldDeltas,
        normalizedAreaHectares: updatedHectares,
      },
      tx,
    });

    return {
      success: true,
      record: updatedRecord,
      auditBlock,
    };
  });
};

export default {
  fetchReviewQueue,
  acquireReviewLock,
  releaseReviewLock,
  submitReviewDecision,
};
