import prisma from '../../config/prisma.js';

export const getRecordDetails = async (recordId) => {
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

  if (!record) {
    throw new Error('Land record not found');
  }

  return {
    ...record,
    applicationNo: record.document?.id ? `APP-${record.document.id.slice(0, 8).toUpperCase()}` : `APP-${record.id.slice(0, 8).toUpperCase()}`,
    auditLogs: record.auditLogs.map((log) => ({
      ...log,
      sequenceNumber: Number(log.sequenceNumber),
    })),
  };
};

export const getUserApplications = async (userId) => {
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

  return records.map((r) => ({
    ...r,
    applicationNo: r.document?.id ? `APP-${r.document.id.slice(0, 8).toUpperCase()}` : `APP-${r.id.slice(0, 8).toUpperCase()}`,
  }));
};

export const searchRecords = async ({ query = '', villageLgd = null, status = null, limit = 20, offset = 0 }) => {
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
};

export default {
  getRecordDetails,
  searchRecords,
};
