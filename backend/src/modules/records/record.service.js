import prisma from '../../config/prisma.js';

export const getRecordDetails = async (recordId) => {
  const record = await prisma.landRecord.findUnique({
    where: { id: recordId },
    include: {
      document: {
        select: {
          originalFilename: true,
          s3Key: true,
          preprocessedS3Key: true,
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
    auditLogs: record.auditLogs.map((log) => ({
      ...log,
      sequenceNumber: Number(log.sequenceNumber),
    })),
  };
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
