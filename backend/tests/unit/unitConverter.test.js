import { convertLandArea, sanitizeUnitName } from '../../src/services/validation/unitConverter.js';

describe('Multi-Region Land Unit Normalization Service', () => {
  test('Sanitizes dirty unit strings properly', () => {
    expect(sanitizeUnitName('  Pucca Bigha  ')).toBe('PUCCA_BIGHA');
    expect(sanitizeUnitName('guntha / gunte')).toBe('GUNTHA_GUNTE');
  });

  test('Converts standard Hectares to square meters and hectares', () => {
    const result = convertLandArea(2.5, 'Hectare');
    expect(result.normalizedAreaSqm).toBe(25000);
    expect(result.normalizedAreaHectares).toBe(2.5);
    expect(result.isAmbiguous).toBe(false);
  });

  test('Converts Standard Acre to metric', () => {
    const result = convertLandArea(1.0, 'Acre');
    expect(result.normalizedAreaSqm).toBeCloseTo(4046.86, 1);
    expect(result.normalizedAreaHectares).toBeCloseTo(0.404686, 4);
  });

  test('Converts Maharashtra Guntha correctly (1 Guntha = 1,089 sq ft)', () => {
    const result = convertLandArea(10, 'Guntha', '27'); // State LGD 27: Maharashtra
    expect(result.normalizedAreaSqm).toBeCloseTo(1011.71, 1);
    expect(result.normalizedAreaHectares).toBeCloseTo(0.101171, 4);
    expect(result.isAmbiguous).toBe(false);
  });

  test('Converts Tamil Nadu Cent correctly (1 Cent = 435.6 sq ft)', () => {
    const result = convertLandArea(50, 'Cent', '33'); // State LGD 33: Tamil Nadu
    expect(result.normalizedAreaSqm).toBeCloseTo(2023.43, 1);
    expect(result.normalizedAreaHectares).toBeCloseTo(0.202343, 4);
  });

  test('Converts Punjab Kanal and Marla correctly', () => {
    const kanalRes = convertLandArea(1, 'Kanal', '03'); // Punjab
    expect(kanalRes.normalizedAreaSqm).toBeCloseTo(505.86, 1);

    const marlaRes = convertLandArea(1, 'Marla', '03');
    expect(marlaRes.normalizedAreaSqm).toBeCloseTo(25.29, 1);
  });

  test('Detects ambiguity for generic "Bigha" in Uttar Pradesh and provides options', () => {
    const result = convertLandArea(4.0, 'Bigha', '09'); // UP
    expect(result.isAmbiguous).toBe(true);
    expect(result.disambiguationOptions).toHaveLength(2);
    expect(result.disambiguationOptions[0].key).toBe('PUCCA_BIGHA');
    expect(result.disambiguationOptions[1].key).toBe('KUCCHA_BIGHA');
    // Default applied should be Pucca
    expect(result.normalizedAreaSqm).toBeCloseTo(4.0 * 2529.285, 1);
  });

  test('Throws error on non-positive area value', () => {
    expect(() => convertLandArea(-5, 'Acre')).toThrow();
    expect(() => convertLandArea('not-a-number', 'Acre')).toThrow();
  });
});
