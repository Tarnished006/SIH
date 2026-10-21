import prisma from '../../config/prisma.js';


const DEMO_DETAIL_RECORD = {
  id: '00000000-0000-0000-0000-000000000010',
  surveyNumber: '142/3A',
  villageName: 'Thippagondanahalli',
  villageLgd: '572',
  ulpin: 'KA-29-08-014-00142-003A',
  rawArea: 2.14,
  rawUnit: 'Acre',
  normalizedAreaHectares: 0.866,
  normalizedAreaSqm: 8660.25,
  landClassification: 'Dry Agricultural / Patta Land',
  reviewStatus: 'PENDING_REVIEW',
  reviewPriorityScore: 0.88,
  overallConfidence: 0.74,
  operatorRemarks: '',
  decisionRemarks: '',
  createdAt: new Date().toISOString(),
  applicationNo: 'APP-84A29B01',
  document: {
    id: 'doc-00000000-0000-0000-0000-000000000001',
    originalFilename: 'RTC_Form16_Sy142_3A.jpg',
    status: 'PROCESSED',
    mimeType: 'image/jpeg',
    createdAt: new Date().toISOString(),
  },
  owners: [
    { name: 'Ramakrishnaiah S/o Venkatappa', nameEnglish: 'Ramakrishnaiah', sharePercent: 100, relationship: 'self' }
  ],
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
  auditLogs: [
    {
      sequenceNumber: 1,
      action: 'DOCUMENT_INTAKE_OCR',
      actorRole: 'SYSTEM',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      currHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      timestamp: new Date().toISOString(),
    }
  ],
};

export const getRecordDetails = async (recordId) => {
  try {
    const { getLiveRecord } = await import('../../services/storage/liveRecordStore.js');
    const live = getLiveRecord(recordId);
    if (live) {
      return live;
    }

    const record = await prisma.landRecord.findUnique({
      where: { id: recordId },
      include: {
        document: {
          select: {
            id: true,
            originalFilename: true,
            s3Key: true,
            preprocessedS3Key: true,
            uploadedById: true,
            mimeType: true,
            status: true,
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
        parcelGeometries: true,
        auditLogs: {
          orderBy: { sequenceNumber: 'asc' },
          select: {
            sequenceNumber: true,
            action: true,
            actorRole: true,
            prevHash: true,
            currHash: true,
            delta: true,
            timestamp: true,
          },
        },
      },
    });

    if (record) {
      return {
        ...record,
        applicationNo: record.document?.id ? `APP-${record.document.id.slice(0, 8).toUpperCase()}` : `APP-${record.id.slice(0, 8).toUpperCase()}`,
        auditLogs: (record.auditLogs || []).map((log) => ({
          ...log,
          sequenceNumber: Number(log.sequenceNumber),
        })),
      };
    }
    return { ...DEMO_DETAIL_RECORD, id: recordId };
  } catch (dbErr) {
    console.warn(`[RECORD_DETAILS_DB_FALLBACK] Database unreachable (${dbErr.message}). Issuing demo record.`);
    return { ...DEMO_DETAIL_RECORD, id: recordId };
  }
};


const DEMO_CITIZEN_APPLICATIONS = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    surveyNumber: '142/3A',
    villageName: 'Thippagondanahalli',
    villageLgd: '572',
    ulpin: 'KA-29-08-014-00142-003A',
    rawArea: 2.14,
    rawUnit: 'Acre',
    normalizedAreaHectares: 0.866,
    reviewStatus: 'CORRECTIONS_REQUESTED',
    operatorRemarks: 'Patwari Inspection: Uploaded RTC Form 16 scan is blurred on Column 3 (Area). Please re-upload a clear, well-lit flat scan.',
    correctionsRequested: 'Uploaded RTC Form 16 scan is blurred on Column 3 (Area). Please re-upload a clear, well-lit flat scan.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    applicationNo: 'APP-84A29B01',
    document: {
      id: 'doc-00000000-0000-0000-0000-000000000001',
      originalFilename: 'RTC_Form16_Sy142_3A.jpg',
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    },
    owners: [{ name: 'Ramakrishnaiah S/o Venkatappa', sharePercent: 100 }],
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    surveyNumber: '143/3',
    villageName: 'Rampur (Kasaba)',
    villageLgd: '572',
    ulpin: 'KA-29-08-014-00143-0003',
    rawArea: 3.6,
    rawUnit: 'Acre',
    normalizedAreaHectares: 1.459,
    reviewStatus: 'FORWARDED_TO_TEHSILDAR',
    operatorRemarks: 'Document verified against Revenue Taluk register. Area conversion checked.',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    applicationNo: 'APP-99F12A02',
    document: {
      id: 'doc-00000000-0000-0000-0000-000000000002',
      originalFilename: 'UP_Khasra_143_3.jpg',
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    },
    owners: [{ name: 'उमाकांत प्रसाद (Umakant Prasad)', sharePercent: 100 }],
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    surveyNumber: '141/2',
    villageName: 'Thippagondanahalli',
    villageLgd: '572',
    ulpin: 'KA-29-08-014-00141-0002',
    rawArea: 1.5,
    rawUnit: 'Acre',
    normalizedAreaHectares: 0.607,
    reviewStatus: 'APPROVED',
    decisionRemarks: 'Application verified and approved by Tehsildar under Section 128 of Karnataka Land Revenue Act.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    applicationNo: 'APP-71C03D19',
    document: {
      id: 'doc-00000000-0000-0000-0000-000000000003',
      originalFilename: 'RTC_Form16_Sy141_2.jpg',
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    },
    owners: [{ name: 'Muniyappa S/o Govindappa', sharePercent: 100 }],
  },
];

export const getUserApplications = async (userId, userEmail = null, userRole = 'CITIZEN') => {
  try {
    const { getAllLiveRecords } = await import('../../services/storage/liveRecordStore.js');
    const allLive = getAllLiveRecords();
    const live = userRole === 'CITIZEN' && userId
      ? allLive.filter((r) => {
          return (
            r.submittedBy?.id === userId ||
            r.document?.uploadedById === userId ||
            r.uploadedById === userId ||
            (userEmail && (r.submittedBy?.email === userEmail || r.document?.uploadedByUsername === userEmail.split('@')[0]))
          );
        })
      : allLive;

    const records = await prisma.landRecord.findMany({
      where: {
        document: {
          uploadedById: userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        document: {
          select: {
            id: true,
            originalFilename: true,
            status: true,
            s3Key: true,
            createdAt: true,
            uploadedById: true,
          },
        },
        fieldExtractions: {
          orderBy: { createdAt: 'asc' },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const dbMapped = (records || []).map((r) => ({
      ...r,
      applicationNo: r.document?.id ? `APP-${r.document.id.slice(0, 8).toUpperCase()}` : `APP-${r.id.slice(0, 8).toUpperCase()}`,
    }));
    const combined = [...live, ...dbMapped];
    return combined.length > 0 ? combined : DEMO_CITIZEN_APPLICATIONS;
  } catch (dbErr) {
    const { getAllLiveRecords } = await import('../../services/storage/liveRecordStore.js');
    const allLive = getAllLiveRecords();
    const live = userRole === 'CITIZEN' && userId
      ? allLive.filter((r) => {
          return (
            r.submittedBy?.id === userId ||
            r.document?.uploadedById === userId ||
            r.uploadedById === userId ||
            (userEmail && (r.submittedBy?.email === userEmail || r.document?.uploadedByUsername === userEmail.split('@')[0]))
          );
        })
      : allLive;
    return live.length > 0 ? live : DEMO_CITIZEN_APPLICATIONS;
  }
};

export const searchRecords = async ({ query = '', villageLgd = null, status = null, limit = 20, offset = 0 }) => {
  try {
    const where = {};

    if (villageLgd) {
      where.villageLgd = villageLgd;
    }

    if (status) {
      where.reviewStatus = status;
    }

    if (query) {
      where.OR = [
        { surveyNumber: { contains: query, mode: 'insensitive' } },
        { ulpin: { contains: query, mode: 'insensitive' } },
        { villageName: { contains: query, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.landRecord.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        surveyNumber: true,
        villageName: true,
        villageLgd: true,
        ulpin: true,
        rawArea: true,
        rawUnit: true,
        normalizedAreaHectares: true,
        owners: true,
        reviewStatus: true,
        reviewPriorityScore: true,
        createdAt: true,
      },
    });

    return records;
  } catch (dbErr) {
    console.warn(`[SEARCH_RECORDS_DB_FALLBACK] Database unreachable (${dbErr.message}). Returning empty records.`);
    return [];
  }
};

export default {
  getRecordDetails,
  searchRecords,
};
