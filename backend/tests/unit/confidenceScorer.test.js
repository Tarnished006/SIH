import {
  scoreField,
  scoreDocument,
  FIELD_CLASSIFICATIONS,
} from '../../src/services/scoring/confidenceScorer.js';

describe('Explainable Review Scorer', () => {
  describe('scoreField', () => {
    test('Classifies as MATCH when confidence and image quality are high and rules pass', () => {
      const result = scoreField(0.95, 0.90, true, 'survey_number');
      expect(result.classification).toBe(FIELD_CLASSIFICATIONS.MATCH);
      expect(result.compositeScore).toBeGreaterThan(0.85);
      expect(result.reviewPriority).toBeLessThan(0.20);
    });

    test('Classifies as CONFLICT when rule fails regardless of AI confidence', () => {
      const result = scoreField(0.98, 0.95, false, 'ownership_share');
      expect(result.classification).toBe(FIELD_CLASSIFICATIONS.CONFLICT);
      expect(result.rationale).toContain('Rule validation failed');
    });

    test('Classifies as UNCERTAIN when confidence is moderate', () => {
      const result = scoreField(0.72, 0.80, true, 'owner_name');
      expect(result.classification).toBe(FIELD_CLASSIFICATIONS.UNCERTAIN);
    });
  });

  describe('scoreDocument', () => {
    test('Assigns low review priority when all fields match cleanly', () => {
      const fields = [
        scoreField(0.95, 0.9, true, 'f1'),
        scoreField(0.92, 0.9, true, 'f2'),
      ];
      const doc = scoreDocument(fields, { passed: true, flags: [] });
      expect(doc.statusCategory).toBe(FIELD_CLASSIFICATIONS.MATCH);
      expect(doc.reviewPriorityScore).toBeLessThan(0.40);
    });

    test('Escalates review priority to high when a critical conflict is present', () => {
      const fields = [
        scoreField(0.95, 0.9, true, 'f1'),
        scoreField(0.50, 0.5, false, 'f2'), // conflict
      ];
      const doc = scoreDocument(fields, { passed: false, flags: ['SHARE_SUM_MISMATCH'] });
      expect(doc.statusCategory).toBe(FIELD_CLASSIFICATIONS.CONFLICT);
      expect(doc.reviewPriorityScore).toBeGreaterThanOrEqual(0.90);
    });
  });
});
