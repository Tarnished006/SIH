import { getRecordDetails, searchRecords } from './record.service.js';

export const getRecord = async (req, res, next) => {
  try {
    const record = await getRecordDetails(req.params.id);
    res.json({ success: true, record });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
};

export const findRecords = async (req, res, next) => {
  try {
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

export default { getRecord, findRecords };
