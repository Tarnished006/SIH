import {
  fetchReviewQueue,
  acquireReviewLock,
  releaseReviewLock,
  submitReviewDecision,
} from './review.service.js';

export const getQueue = async (req, res, next) => {
  try {
    const { villageLgd, limit, offset } = req.query;
    const queue = await fetchReviewQueue({
      villageLgd,
      limit: parseInt(limit || '20', 10),
      offset: parseInt(offset || '0', 10),
    });
    res.json({ success: true, count: queue.length, queue });
  } catch (error) {
    next(error);
  }
};

export const lockRecord = async (req, res, next) => {
  try {
    const result = await acquireReviewLock(req.params.recordId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(409).json({ success: false, error: error.message });
  }
};

export const unlockRecord = async (req, res, next) => {
  try {
    const result = await releaseReviewLock(req.params.recordId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const submitDecision = async (req, res, next) => {
  try {
    const { fieldDecisions, finalStatus, notes, manualArea } = req.body;
    const result = await submitReviewDecision({
      recordId: req.params.recordId,
      reviewerId: req.user.id,
      reviewerRole: req.user.role,
      fieldDecisions,
      finalStatus: finalStatus || 'VERIFIED',
      notes,
      manualArea,
    });
    res.json({ success: true, message: 'Review decision recorded and digitally signed', ...result });
  } catch (error) {
    next(error);
  }
};

export default {
  getQueue,
  lockRecord,
  unlockRecord,
  submitDecision,
};
