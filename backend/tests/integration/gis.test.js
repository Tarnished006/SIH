import {
  validateAndAnalyzePolygon,
  checkParcelOverlap,
} from '../../src/modules/gis/gis.service.js';

describe('GIS Spatial Topology Engine (Turf.js & PostGIS)', () => {
  // A clean rectangle in Lucknow (approx ~100m x 100m = ~10,000 m² = 1 hectare)
  const validParcelPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [80.9400, 26.8400],
        [80.9410, 26.8400],
        [80.9410, 26.8409],
        [80.9400, 26.8409],
        [80.9400, 26.8400],
      ],
    ],
  };

  test('Calculates geodesic area and confirms valid topology with 0 kinks', () => {
    const analysis = validateAndAnalyzePolygon(validParcelPolygon);
    expect(analysis.isValid).toBe(true);
    expect(analysis.kinkCount).toBe(0);
    expect(analysis.calculatedAreaSqm).toBeGreaterThan(9000);
    expect(analysis.calculatedAreaSqm).toBeLessThan(12000);
    expect(analysis.centroid.latitude).toBeCloseTo(26.84, 1);
    expect(analysis.centroid.longitude).toBeCloseTo(80.94, 1);
  });

  test('Detects self-intersecting invalid polygons (bowtie/figure-8)', () => {
    // Bowtie polygon with self-intersecting edge
    const invalidBowtie = {
      type: 'Polygon',
      coordinates: [
        [
          [80.9400, 26.8400],
          [80.9410, 26.8409],
          [80.9410, 26.8400],
          [80.9400, 26.8409],
          [80.9400, 26.8400],
        ],
      ],
    };

    const analysis = validateAndAnalyzePolygon(invalidBowtie);
    expect(analysis.isValid).toBe(false);
    expect(analysis.kinkCount).toBeGreaterThan(0);
  });

  test('Detects spatial parcel overlap (encroachment / boundary conflict)', () => {
    // Second polygon overlapping with the first one
    const overlappingPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [80.9405, 26.8405],
          [80.9415, 26.8405],
          [80.9415, 26.8415],
          [80.9405, 26.8415],
          [80.9405, 26.8405],
        ],
      ],
    };

    const overlapResult = checkParcelOverlap(validParcelPolygon, overlappingPolygon);
    expect(overlapResult.doesOverlap).toBe(true);
    expect(overlapResult.intersectionAreaSqm).toBeGreaterThan(0);
    expect(overlapResult.hasEncroachment).toBe(true);
  });
});
