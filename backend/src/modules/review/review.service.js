import prisma from '../../config/prisma.js';
import { appendAuditLog } from '../../services/audit/hashChain.js';
import { convertLandArea } from '../../services/validation/unitConverter.js';

export const fetchReviewQueue = async ({ role = 'PATWARI', villageLgd = null, limit = 50, offset = 0 }) => {
  let statusList = ['PENDING_REVIEW', 'IN_REVIEW', 'CORRECTIONS_REQUESTED'];
  if (role === 'TEHSILDAR') {
    statusList = ['FORWARDED_TO_TEHSILDAR', 'IN_REVIEW', 'SUBMITTED', 'CORRECTIONS_REQUESTED'];
  }

  const where = {
    reviewStatus: { in: statusList },
  };

  if (villageLgd) {
    where.villageLgd = villageLgd;
  }

  const queue = await prisma.landRecord.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [{ reviewPriorityScore: 'desc' }, { createdAt: 'desc' }],
    include: {
      document: {
        select: {
          id: true,
          originalFilename: true,
          status: true,
          s3Key: true,
          uploadedById: true,
          createdAt: true,
        },
      },
      verifiedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      fieldExtractions: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return queue.map((r) => ({
    ...r,
    applicationNo: r.document?.id ? `APP-${r.document.id.slice(0, 8).toUpperCase()}` : `APP-${r.id.slice(0, 8).toUpperCase()}`,
  }));
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
    throw new Error('Record is currently locked by another officer for review.');
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
    },
  });
  return { success: true, message: 'Review lock released' };
};

/**
 * Patwari / Operator submits review with field corrections & remarks to Tehsildar
 */
export const submitOperatorReview = async ({
  recordId,
  operatorId,
  fieldDecisions = [], // [{ fieldId, status: 'ACCEPTED'|'CORRECTED', verifiedValue, reason }]
  operatorRemarks = '',
  manualArea = null,
}) => {
  return await prisma.$transaction(async (tx) => {
    const record = await tx.landRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) {
      throw new Error('Land record not found');
    }

    // 1. Update field corrections
    const fieldDeltas = [];
    for (const decision of fieldDecisions) {
      if (!decision.fieldId) continue;
      const updatedField = await tx.fieldExtraction.update({
        where: { id: decision.fieldId },
        data: {
          humanVerifiedValue: decision.verifiedValue !== undefined ? String(decision.verifiedValue) : null,
          status: decision.status || 'CORRECTED',
          correctionReason: decision.reason || null,
        },
        select: {
          id: true,
          fieldName: true,
          aiExtractedValue: true,
          humanVerifiedValue: true,
          status: true,
          correctionReason: true,
        },
      });
      fieldDeltas.push(updatedField);
    }

    // 2. Area adjustments if specified
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

    // 3. Transition to FORWARDED_TO_TEHSILDAR
    const updatedRecord = await tx.landRecord.update({
      where: { id: recordId },
      data: {
        reviewStatus: 'FORWARDED_TO_TEHSILDAR',
        operatorRemarks: operatorRemarks || 'Review completed by Patwari; submitted to Tehsildar.',
        lockedById: null,
        lockedAt: null,
        rawArea: updatedRawArea,
        rawUnit: updatedRawUnit,
        normalizedAreaSqm: updatedSqm,
        normalizedAreaHectares: updatedHectares,
      },
    });

    // 4. Audit ledger block
    const auditBlock = await appendAuditLog({
      recordId,
      actorId: operatorId,
      actorRole: 'PATWARI',
      action: 'OPERATOR_SUBMITTED_TO_TEHSILDAR',
      delta: {
        previousReviewStatus: record.reviewStatus,
        newReviewStatus: 'FORWARDED_TO_TEHSILDAR',
        operatorRemarks,
        fieldCorrectionsCount: fieldDeltas.length,
        fieldChanges: fieldDeltas,
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

/**
 * Tehsildar executes final decision: APPROVED, REJECTED, or CORRECTIONS_REQUESTED
 */
export const submitTehsildarDecision = async ({
  recordId,
  tehsildarId,
  decision, // 'APPROVED' | 'REJECTED' | 'CORRECTIONS_REQUESTED'
  remarks = '',
}) => {
  const validDecisions = ['APPROVED', 'REJECTED', 'CORRECTIONS_REQUESTED'];
  if (!validDecisions.includes(decision)) {
    throw new Error(`Invalid Tehsildar decision: ${decision}. Must be one of: ${validDecisions.join(', ')}`);
  }

  return await prisma.$transaction(async (tx) => {
    const record = await tx.landRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) {
      throw new Error('Land record not found');
    }

    const updateData = {
      reviewStatus: decision,
      decisionRemarks: remarks || `Application ${decision.toLowerCase()} by Tehsildar`,
      verifiedById: tehsildarId,
      verifiedAt: new Date(),
      lockedById: null,
      lockedAt: null,
    };

    if (decision === 'REJECTED') {
      updateData.rejectionReason = remarks || 'Application rejected by Tehsildar.';
    } else if (decision === 'CORRECTIONS_REQUESTED') {
      updateData.correctionsRequested = remarks || 'Corrections requested by Tehsildar.';
    }

    const updatedRecord = await tx.landRecord.update({
      where: { id: recordId },
      data: updateData,
    });

    const auditBlock = await appendAuditLog({
      recordId,
      actorId: tehsildarId,
      actorRole: 'TEHSILDAR',
      action: `TEHSILDAR_DECISION_${decision}`,
      delta: {
        previousReviewStatus: record.reviewStatus,
        decision,
        remarks,
        timestamp: new Date().toISOString(),
      },
      tx,
    });

    return {
      success: true,
      decision,
      record: updatedRecord,
      auditBlock,
    };
  });
};

export default {
  fetchReviewQueue,
  acquireReviewLock,
  releaseReviewLock,
  submitOperatorReview,
  submitTehsildarDecision,
};
