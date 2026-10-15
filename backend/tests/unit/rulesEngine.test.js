import {
  validateOwnershipShares,
  validateAreaDiscrepancy,
  runComprehensiveValidation,
} from '../../src/services/validation/rulesEngine.js';

describe('DILRMP Legal Validation Engine', () => {
  describe('Ownership Share Validation', () => {
    test('Passes when ownership shares aggregate to exactly 100%', () => {
      const owners = [
        { name: 'Ramesh', sharePercent: 60.0 },
        { name: 'Suresh', sharePercent: 40.0 },
      ];
      const result = validateOwnershipShares(owners);
      expect(result.isValid).toBe(true);
      expect(result.totalShare).toBe(100.0);
      expect(result.discrepancy).toBe(0);
    });

    test('Fails and flags discrepancy when shares sum to 85%', () => {
      const owners = [
        { name: 'Ramesh', sharePercent: 50.0 },
        { name: 'Suresh', sharePercent: 35.0 },
      ];
      const result = validateOwnershipShares(owners);
      expect(result.isValid).toBe(false);
      expect(result.totalShare).toBe(85.0);
      expect(result.discrepancy).toBe(15.0);
    });

    test('Fails on empty owners list', () => {
      const result = validateOwnershipShares([]);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Deed vs Polygon Area Discrepancy', () => {
    test('Passes when geometric area is within 5% tolerance', () => {
      const deedArea = 10000.0; // 1 Hectare
      const polyArea = 9800.0; // 2% diff
      const result = validateAreaDiscrepancy(deedArea, polyArea, 5.0);
      expect(result.hasDiscrepancy).toBe(false);
      expect(result.percentageDiff).toBe(2.0);
    });

    test('Flags discrepancy when geometric area differs by more than tolerance', () => {
      const deedArea = 10000.0;
      const polyArea = 8500.0; // 15% diff
      const result = validateAreaDiscrepancy(deedArea, polyArea, 5.0);
      expect(result.hasDiscrepancy).toBe(true);
      expect(result.percentageDiff).toBe(15.0);
    });
  });

  describe('Comprehensive Validation Suite', () => {
    test('Runs all checks and returns flags', () => {
      const record = {
        surveyNumber: '142/A-1',
        owners: [
          { name: 'Owner A', sharePercent: 70 },
          { name: 'Owner B', sharePercent: 30 },
        ],
        normalizedAreaSqm: 5000,
        isAmbiguousUnit: false,
      };

      const spatial = { calculatedAreaSqm: 4950 };
      const report = runComprehensiveValidation(record, spatial);
      expect(report.passed).toBe(true);
      expect(report.flags).toHaveLength(0);
    });

    test('Detects multiple simultaneous violations', () => {
      const record = {
        surveyNumber: '???INVALID!!###',
        owners: [{ name: 'Owner A', sharePercent: 50 }], // only 50%
        normalizedAreaSqm: 5000,
        isAmbiguousUnit: true,
      };

      const report = runComprehensiveValidation(record);
      expect(report.passed).toBe(false);
      expect(report.flags).toContain('INVALID_SURVEY_FORMAT');
      expect(report.flags).toContain('SHARE_SUM_MISMATCH');
      expect(report.flags).toContain('AMBIGUOUS_UNIT');
    });
  });
});
