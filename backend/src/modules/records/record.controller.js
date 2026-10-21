import { getRecordDetails, searchRecords, getUserApplications } from './record.service.js';

export const getRecord = async (req, res, next) => {
  try {
    const record = await getRecordDetails(req.params.id);

    // Record-level ownership check:
    // If role is CITIZEN, the document MUST have been uploaded by this user!
    if (req.user?.role === 'CITIZEN' && record.document?.uploadedById !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Access denied. You do not have permission to view other citizens\' applications or documents.',
      });
    }

    res.json({ success: true, record });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await getUserApplications(req.user.id, req.user?.email, req.user?.role);
    res.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

export const findRecords = async (req, res, next) => {
  try {
    // If role is CITIZEN, only return their own records
    if (req.user?.role === 'CITIZEN') {
      const applications = await getUserApplications(req.user.id, req.user?.email, req.user?.role);
      return res.json({ success: true, count: applications.length, records: applications });
    }

    const { query, villageLgd, status, limit, offset } = req.query;
    const records = await searchRecords({
      query,
      villageLgd,
      status,
      limit: parseInt(limit || '20', 10),
      offset: parseInt(offset || '0', 10),
    });
    res.json({ success: true, count: records.length, records });
  } catch (error) {
    next(error);
  }
};

export default { getRecord, getMyApplications, findRecords };
