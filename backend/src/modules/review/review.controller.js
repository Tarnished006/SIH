import {
  fetchReviewQueue,
  acquireReviewLock,
  releaseReviewLock,
  submitOperatorReview,
  submitTehsildarDecision,
} from './review.service.js';

export const getQueue = async (req, res, next) => {
  try {
    const { villageLgd, limit, offset } = req.query;
    const queue = await fetchReviewQueue({
      role: req.user.role,
      villageLgd,
      limit: parseInt(limit || '50', 10),
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

/**
 * Patwari / Operator submits corrections and remarks to Tehsildar
 */
export const operatorSubmit = async (req, res, next) => {
  try {
    if (req.user.role !== 'PATWARI') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only Patwari/Operator can submit operator reviews.',
      });
    }

    const { fieldDecisions, operatorRemarks, notes, manualArea, action } = req.body;
    const result = await submitOperatorReview({
      recordId: req.params.recordId,
      operatorId: req.user.id,
      fieldDecisions: fieldDecisions || [],
      operatorRemarks: operatorRemarks || notes || '',
      manualArea,
      action: action || 'SUBMIT_TO_TEHSILDAR',
    });

    res.json({
      success: true,
      message: 'Application corrections recorded and submitted to Tehsildar for verification',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tehsildar verifies and makes official decision: APPROVED, REJECTED, or CORRECTIONS_REQUESTED
 */
export const tehsildarDecision = async (req, res, next) => {
  try {
    if (req.user.role !== 'TEHSILDAR') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only Tehsildar is authorized to approve, reject, or request corrections for land records.',
      });
    }

    const decision = (req.body.decision || req.body.finalStatus || '').toUpperCase();
    const remarks = req.body.remarks || req.body.notes || '';

    const result = await submitTehsildarDecision({
      recordId: req.params.recordId,
      tehsildarId: req.user.id,
      decision,
      remarks,
    });

    res.json({
      success: true,
      message: `Application ${decision.toLowerCase()} successfully by Tehsildar`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backward-compatible endpoint handling submit requests from workbench
 */
export const submitDecision = async (req, res, next) => {
  try {
    if (req.user.role === 'PATWARI') {
      // Operator must NOT be allowed to directly approve or reject
      const requestedStatus = (req.body.finalStatus || '').toUpperCase();
      if (requestedStatus === 'VERIFIED' || requestedStatus === 'APPROVED' || requestedStatus === 'REJECTED') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Operators are not permitted to approve or reject applications. You can only review, correct, add remarks, and submit to the Tehsildar.',
        });
      }
      return operatorSubmit(req, res, next);
    }

    if (req.user.role === 'TEHSILDAR') {
      return tehsildarDecision(req, res, next);
    }

    return res.status(403).json({ success: false, error: 'Forbidden: Invalid role for review submission' });
  } catch (error) {
    next(error);
  }
};

export default {
  getQueue,
  lockRecord,
  unlockRecord,
  operatorSubmit,
  tehsildarDecision,
  submitDecision,
};
