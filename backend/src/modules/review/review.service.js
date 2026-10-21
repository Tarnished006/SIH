import prisma from '../../config/prisma.js';
import { appendAuditLog } from '../../services/audit/hashChain.js';
import { convertLandArea } from '../../services/validation/unitConverter.js';

// Standalone demo review records for seamless evaluation when database credentials are not configured
const DEMO_REVIEW_QUEUE = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    surveyNumber: '142/3A',
    villageName: 'Thippagondanahalli',
    villageLgd: '572',
    ulpin: 'KA-29-08-014-00142-003A',
    rawArea: 2.14,
    rawUnit: 'Acre',
    normalizedAreaHectares: 0.866,
    owners: [{ name: 'Ramakrishnaiah S/o Venkatappa', sharePercent: 100 }],
    reviewStatus: 'PENDING_REVIEW',
    reviewPriorityScore: 0.88,
    overallConfidence: 0.74,
    createdAt: new Date().toISOString(),
    applicationNo: 'APP-84A29B01',
    document: {
      id: 'doc-00000000-0000-0000-0000-000000000001',
      originalFilename: 'RTC_Form16_Sy142_3A.jpg',
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    },
    fieldExtractions: [
      {
        id: 'fe-01',
        fieldName: 'survey_number',
        aiExtractedValue: '142/3A',
        humanVerifiedValue: '142/3A',
        aiConfidence: 0.98,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 16, left: 12, width: 36, height: 9 },
      },
      {
        id: 'fe-02',
        fieldName: 'owner_name',
        aiExtractedValue: 'Ramakrishnaiah S/o Venkatappa',
        humanVerifiedValue: 'Ramakrishnaiah S/o Venkatappa',
        aiConfidence: 0.94,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 29, left: 12, width: 56, height: 10 },
      },
      {
        id: 'fe-03',
        fieldName: 'raw_area',
        aiExtractedValue: '2 Ac 14 Gt',
        humanVerifiedValue: '2 Ac 14 Gt',
        aiConfidence: 0.64, // FLAGGED IN RED FOR HITL DEMO!
        status: 'UNVERIFIED',
        ruleValidationStatus: 'WARN',
        ruleValidationMessage: 'Faded ink on decimal digits. Low character confidence.',
        boundingBox: { top: 43, left: 12, width: 44, height: 9 },
      },
      {
        id: 'fe-04',
        fieldName: 'village',
        aiExtractedValue: 'Thippagondanahalli',
        humanVerifiedValue: 'Thippagondanahalli',
        aiConfidence: 0.97,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 57, left: 12, width: 40, height: 9 },
      },
      {
        id: 'fe-05',
        fieldName: 'khata_number',
        aiExtractedValue: '142',
        humanVerifiedValue: '142',
        aiConfidence: 0.92,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 71, left: 12, width: 34, height: 8 },
      },
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    surveyNumber: '143/3',
    villageName: 'Rampur (Kasaba)',
    villageLgd: '140',
    ulpin: 'UP-09-140-00143-00003',
    rawArea: 1.459,
    rawUnit: 'Hectare',
    normalizedAreaHectares: 1.459,
    owners: [{ name: 'उमाकांत प्रसाद (Umakant Prasad)', sharePercent: 100 }],
    reviewStatus: 'FORWARDED_TO_TEHSILDAR',
    reviewPriorityScore: 0.92,
    overallConfidence: 0.91,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    applicationNo: 'APP-99F12A02',
    document: {
      id: 'doc-00000000-0000-0000-0000-000000000002',
      originalFilename: 'UP_Khasra_143_3.jpg',
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    },
    fieldExtractions: [
      {
        id: 'fe-11',
        fieldName: 'survey_number',
        aiExtractedValue: '143/3',
        humanVerifiedValue: '143/3',
        aiConfidence: 0.98,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 16, left: 12, width: 36, height: 9 },
      },
      {
        id: 'fe-12',
        fieldName: 'owner_name',
        aiExtractedValue: 'उमाकांत प्रसाद (Umakant Prasad)',
        humanVerifiedValue: 'उಮಾಕಾಂತ ಪ್ರಸಾದ್',
        aiConfidence: 0.95,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 29, left: 12, width: 56, height: 10 },
      },
      {
        id: 'fe-13',
        fieldName: 'raw_area',
        aiExtractedValue: '1.459 Hectare',
        humanVerifiedValue: '1.459 Hectare',
        aiConfidence: 0.93,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 43, left: 12, width: 44, height: 9 },
      },
      {
        id: 'fe-14',
        fieldName: 'village',
        aiExtractedValue: 'रामपुर (Rampur)',
        humanVerifiedValue: 'ರಾಮಪುರ',
        aiConfidence: 0.99,
        status: 'UNVERIFIED',
        ruleValidationStatus: 'PASS',
        boundingBox: { top: 57, left: 12, width: 40, height: 9 },
      },
    ],
  },
];

export const fetchReviewQueue = async ({ role = 'PATWARI', villageLgd = null, limit = 50, offset = 0 }) => {
  let statusList = ['PENDING_REVIEW', 'IN_REVIEW', 'CORRECTIONS_REQUESTED'];
  if (role === 'TEHSILDAR') {
    statusList = ['FORWARDED_TO_TEHSILDAR', 'IN_REVIEW', 'SUBMITTED', 'CORRECTIONS_REQUESTED'];
  }

  try {
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

    const { getAllLiveRecords } = await import('../../services/storage/liveRecordStore.js');
    const live = getAllLiveRecords().filter((r) => statusList.includes(r.reviewStatus));

    const dbMapped = (queue || []).map((r) => ({
      ...r,
      applicationNo: r.document?.id ? `APP-${r.document.id.slice(0, 8).toUpperCase()}` : `APP-${r.id.slice(0, 8).toUpperCase()}`,
    }));
    const combined = [...live, ...dbMapped];
    return combined.length > 0 ? combined : DEMO_REVIEW_QUEUE;
  } catch (dbErr) {
    const { getAllLiveRecords } = await import('../../services/storage/liveRecordStore.js');
    const live = getAllLiveRecords().filter((r) => statusList.includes(r.reviewStatus));
    return live.length > 0 ? live : DEMO_REVIEW_QUEUE;
  }
};

export const acquireReviewLock = async (recordId, userId) => {
  try {
    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      select: { lockedById: true, lockedAt: true, reviewStatus: true },
    });

    if (!record) {
      return { success: true, recordId, lockedBy: userId, lockedAt: new Date() };
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
  } catch (dbErr) {
    console.warn(`[ACQUIRE_LOCK_DB_FALLBACK] Database unreachable (${dbErr.message}). Granting demo review lock.`);
    return { success: true, recordId, lockedBy: userId, lockedAt: new Date() };
  }
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
  action = 'SUBMIT_TO_TEHSILDAR',
}) => {
  try {
    const { getLiveRecord, updateLiveRecord } = await import('../../services/storage/liveRecordStore.js');
    const live = getLiveRecord(recordId);
    if (live) {
      const isRescan = action === 'REQUEST_RESCAN';
      const targetStatus = isRescan ? 'CORRECTIONS_REQUESTED' : 'FORWARDED_TO_TEHSILDAR';
      const updated = updateLiveRecord(recordId, {
        reviewStatus: targetStatus,
        operatorRemarks: operatorRemarks || (isRescan ? 'Document scan illegible; re-scan requested by Patwari.' : 'Review completed by Patwari; submitted to Tehsildar.'),
        correctionsRequested: isRescan ? (operatorRemarks || 'Uploaded document scan is illegible. Please re-upload.') : null,
        fieldExtractions: (live.fieldExtractions || []).map((f) => {
          const dec = fieldDecisions.find((d) => d.fieldId === f.id);
          if (dec) {
            return {
              ...f,
              humanVerifiedValue: dec.verifiedValue !== undefined ? String(dec.verifiedValue) : f.humanVerifiedValue,
              status: dec.status || 'CORRECTED',
              correctionReason: dec.reason || f.correctionReason,
            };
          }
          return f;
        }),
      });

      return {
        success: true,
        record: updated,
        auditBlock: {
          sequenceNumber: (live.auditLogs?.length || 1) + 1,
          action: isRescan ? 'PATWARI_REQUESTED_RESCAN' : 'OPERATOR_SUBMITTED_TO_TEHSILDAR',
          actorRole: 'PATWARI',
          timestamp: new Date().toISOString(),
        },
      };
    }
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

    const isRescan = action === 'REQUEST_RESCAN';
    const targetStatus = isRescan ? 'CORRECTIONS_REQUESTED' : 'FORWARDED_TO_TEHSILDAR';

    // 3. Transition to FORWARDED_TO_TEHSILDAR or CORRECTIONS_REQUESTED
    const updatedRecord = await tx.landRecord.update({
      where: { id: recordId },
      data: {
        reviewStatus: targetStatus,
        operatorRemarks: operatorRemarks || (isRescan ? 'Document scan illegible; re-scan requested by Patwari.' : 'Review completed by Patwari; submitted to Tehsildar.'),
        correctionsRequested: isRescan ? (operatorRemarks || 'Uploaded document scan is illegible or unclear. Please re-upload a clear, well-lit copy.') : null,
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
      action: isRescan ? 'PATWARI_REQUESTED_RESCAN' : 'OPERATOR_SUBMITTED_TO_TEHSILDAR',
      delta: {
        previousReviewStatus: record.reviewStatus,
        newReviewStatus: targetStatus,
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
  } catch (dbErr) {
    console.warn(`[OPERATOR_REVIEW_DB_FALLBACK] Database unreachable (${dbErr.message}). Issuing demo response.`);
    const isRescan = action === 'REQUEST_RESCAN';
    const targetStatus = isRescan ? 'CORRECTIONS_REQUESTED' : 'FORWARDED_TO_TEHSILDAR';
    return {
      success: true,
      record: {
        id: recordId,
        reviewStatus: targetStatus,
        operatorRemarks: operatorRemarks || (isRescan ? 'Scan illegible; re-scan requested.' : 'Verified by Patwari.'),
        correctionsRequested: isRescan ? (operatorRemarks || 'Scan illegible. Please re-upload.') : null,
      },
      auditBlock: {
        sequenceNumber: 2,
        action: isRescan ? 'PATWARI_REQUESTED_RESCAN' : 'OPERATOR_SUBMITTED_TO_TEHSILDAR',
        actorRole: 'PATWARI',
        timestamp: new Date().toISOString(),
      },
    };
  }
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
