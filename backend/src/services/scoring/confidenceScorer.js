/**
 * BhumiSetu Explainable Confidence & Review Priority Scorer
 * Translates AI confidence, image quality, and rule validity into human-review priorities
 */

export const FIELD_CLASSIFICATIONS = {
  MATCH: 'MATCH',         // High confidence, passed all validation rules
  UNCERTAIN: 'UNCERTAIN', // Moderate confidence, slight degradation or ambiguous unit
  CONFLICT: 'CONFLICT',   // Rule failure, ownership share mismatch, or low AI confidence
};

/**
 * Computes an explainable score for an individual extracted field
 * @param {number} aiConfidence - 0.0 to 1.0 (from Hugging Face model logits)
 * @param {number} imageQuality - 0.0 to 1.0 (from preprocessing sharpness/contrast)
 * @param {boolean} rulePassed - whether field passed syntax/format checks
 * @param {string} fieldName - name of the field
 */
export const scoreField = (aiConfidence = 0.8, imageQuality = 0.85, rulePassed = true, fieldName = '') => {
  const conf = Math.max(0, Math.min(1, parseFloat(aiConfidence) || 0.5));
  const qual = Math.max(0, Math.min(1, parseFloat(imageQuality) || 0.8));

  // Weighted composite score (weights: 50% AI model, 25% Image quality, 25% Rule validity)
  const ruleWeight = rulePassed ? 1.0 : 0.0;
  const compositeScore = parseFloat((0.50 * conf + 0.25 * qual + 0.25 * ruleWeight).toFixed(3));

  let classification = FIELD_CLASSIFICATIONS.MATCH;
  let rationale = 'High model confidence and valid formatting.';

  if (!rulePassed) {
    classification = FIELD_CLASSIFICATIONS.CONFLICT;
    rationale = 'Rule validation failed or data format mismatch.';
  } else if (conf < 0.65 || qual < 0.60) {
    classification = FIELD_CLASSIFICATIONS.CONFLICT;
    rationale = `Low model confidence (${(conf * 100).toFixed(0)}%) or degraded scan quality.`;
  } else if (conf < 0.85 || qual < 0.75) {
    classification = FIELD_CLASSIFICATIONS.UNCERTAIN;
    rationale = `Moderate model confidence (${(conf * 100).toFixed(0)}%). Visual verification advised.`;
  }

  // Priority score for reviewer queue: Higher value = requires more urgent human inspection
  const reviewPriority = parseFloat((1.0 - compositeScore).toFixed(3));

  return {
    fieldName,
    compositeScore,
    reviewPriority,
    classification,
    rationale,
    factors: {
      aiConfidence: conf,
      imageQuality: qual,
      rulePassed,
    },
  };
};

/**
 * Computes aggregate document-level review score & priority
 * @param {Array} fieldScores - array of scored fields
 * @param {object} validationResults - results from rulesEngine
 */
export const scoreDocument = (fieldScores = [], validationResults = { passed: true, flags: [] }) => {
  if (fieldScores.length === 0) {
    return {
      overallConfidence: 0.5,
      reviewPriorityScore: 1.0,
      statusCategory: FIELD_CLASSIFICATIONS.CONFLICT,
      criticalFlags: ['NO_FIELDS_DETECTED'],
      summary: 'No fields detected. Manual full review required.',
    };
  }

  const avgConfidence = fieldScores.reduce((acc, f) => acc + (f.factors?.aiConfidence || 0), 0) / fieldScores.length;
  const hasConflict = fieldScores.some((f) => f.classification === FIELD_CLASSIFICATIONS.CONFLICT) || !validationResults.passed;
  const hasUncertain = fieldScores.some((f) => f.classification === FIELD_CLASSIFICATIONS.UNCERTAIN);

  let statusCategory = FIELD_CLASSIFICATIONS.MATCH;
  let priorityScore = 0.2; // default low priority for clean documents

  if (hasConflict) {
    statusCategory = FIELD_CLASSIFICATIONS.CONFLICT;
    priorityScore = 0.95; // Top priority in officer queue
  } else if (hasUncertain || validationResults.flags?.length > 0) {
    statusCategory = FIELD_CLASSIFICATIONS.UNCERTAIN;
    priorityScore = 0.65;
  }

  return {
    overallConfidence: parseFloat(avgConfidence.toFixed(4)),
    reviewPriorityScore: parseFloat(priorityScore.toFixed(4)),
    statusCategory,
    criticalFlags: validationResults.flags || [],
    conflictCount: fieldScores.filter((f) => f.classification === FIELD_CLASSIFICATIONS.CONFLICT).length,
    uncertainCount: fieldScores.filter((f) => f.classification === FIELD_CLASSIFICATIONS.UNCERTAIN).length,
    matchCount: fieldScores.filter((f) => f.classification === FIELD_CLASSIFICATIONS.MATCH).length,
  };
};

export default {
  scoreField,
  scoreDocument,
  FIELD_CLASSIFICATIONS,
};
