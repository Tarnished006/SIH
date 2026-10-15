import { validateSurveyNumberFormat } from './lgd.js';

/**
 * BhumiSetu Validation Engine
 * Enforces legal rules, ownership share summation, and cross-field consistency
 */

/**
 * Checks whether the sum of fractional or percentage land shares equals 100% (or 1.0)
 * @param {Array<{name: string, sharePercent: number}>} owners
 */
export const validateOwnershipShares = (owners = []) => {
  if (!Array.isArray(owners) || owners.length === 0) {
    return {
      isValid: false,
      totalShare: 0,
      discrepancy: 100,
      message: 'No landowners listed in record.',
    };
  }

  let total = 0;
  for (const owner of owners) {
    const share = parseFloat(owner.sharePercent || owner.share || 0);
    total += share;
  }

  const roundedTotal = parseFloat(total.toFixed(2));
  // Tolerating tiny floating precision differences (99.99 to 100.01)
  const isValid = Math.abs(roundedTotal - 100.0) <= 0.05;

  return {
    isValid,
    totalShare: roundedTotal,
    discrepancy: parseFloat((100.0 - roundedTotal).toFixed(2)),
    message: isValid
      ? 'Ownership shares legally aggregate to 100%.'
      : `Ownership share mismatch: Sum of shares is ${roundedTotal}%, expected 100%.`,
  };
};

/**
 * Cross-validates textual deed area against GIS parcel polygon area
 * @param {number} deedAreaSqm - Area from textual deed normalized to m²
 * @param {number} polygonAreaSqm - Calculated spatial area from PostGIS/Turf in m²
 * @param {number} tolerancePercent - Allowed threshold (default 5%)
 */
export const validateAreaDiscrepancy = (deedAreaSqm, polygonAreaSqm, tolerancePercent = 5.0) => {
  if (!polygonAreaSqm || polygonAreaSqm <= 0) {
    return {
      hasDiscrepancy: false,
      percentageDiff: 0,
      message: 'No spatial polygon available for geometric comparison.',
    };
  }

  const diff = Math.abs(deedAreaSqm - polygonAreaSqm);
  const percentageDiff = parseFloat(((diff / deedAreaSqm) * 100).toFixed(2));
  const hasDiscrepancy = percentageDiff > tolerancePercent;

  return {
    hasDiscrepancy,
    percentageDiff,
    deedAreaSqm,
    polygonAreaSqm,
    message: hasDiscrepancy
      ? `Geometric area (${polygonAreaSqm.toFixed(1)} m²) deviates by ${percentageDiff}% from textual deed (${deedAreaSqm.toFixed(1)} m²).`
      : `Geometric area and textual deed are consistent within ${tolerancePercent}% tolerance.`,
  };
};

/**
 * Runs the comprehensive legal validation suite on a land record payload
 */
export const runComprehensiveValidation = (recordData, spatialData = null) => {
  const flags = [];
  const details = {};

  // 1. Survey Number
  const isSurveyValid = validateSurveyNumberFormat(recordData.surveyNumber);
  details.surveyNumber = {
    isValid: isSurveyValid,
    message: isSurveyValid ? 'Valid survey format' : 'Unusual or invalid survey number format',
  };
  if (!isSurveyValid) {
    flags.push('INVALID_SURVEY_FORMAT');
  }

  // 2. Ownership Shares
  const shareValidation = validateOwnershipShares(recordData.owners);
  details.ownership = shareValidation;
  if (!shareValidation.isValid) {
    flags.push('SHARE_SUM_MISMATCH');
  }

  // 3. Unit Ambiguity
  if (recordData.isAmbiguousUnit) {
    flags.push('AMBIGUOUS_UNIT');
    details.unit = {
      message: 'Regional unit has multiple historical variants. Confirmation required.',
    };
  }

  // 4. Spatial Geometry cross-check
  if (spatialData?.calculatedAreaSqm && recordData.normalizedAreaSqm) {
    const areaCheck = validateAreaDiscrepancy(recordData.normalizedAreaSqm, spatialData.calculatedAreaSqm);
    details.spatialAreaCheck = areaCheck;
    if (areaCheck.hasDiscrepancy) {
      flags.push('SPATIAL_AREA_DISCREPANCY');
    }
  }

  const passed = flags.length === 0;

  return {
    passed,
    flags,
    details,
    ruleCount: 4,
    passedCount: 4 - flags.length,
  };
};

export default {
  validateOwnershipShares,
  validateAreaDiscrepancy,
  runComprehensiveValidation,
};
