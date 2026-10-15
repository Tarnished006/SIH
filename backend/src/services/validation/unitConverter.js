/**
 * BhumiSetu Multi-Region Land Unit Normalization Service
 * Aligned with DILRMP (Digital India Land Records Modernization Programme)
 */

// Canonical multipliers to Square Meters (m²)
export const STANDARD_METRIC_FACTORS = {
  HECTARE: 10000.0,
  SQ_METER: 1.0,
  SQ_FEET: 0.09290304,
  SQ_YARDS: 0.83612736,
  ACRE: 4046.8564224,
};

// State-level & Customary Conversion Rules (Multipliers to m²)
export const REGIONAL_UNIT_RULES = {
  // Uttar Pradesh (State LGD: 09)
  '09': {
    PUCCA_BIGHA: { factor: 2529.285264, label: 'Pucca Bigha (UP)' },
    KUCCHA_BIGHA: { factor: 843.095088, label: 'Kuccha Bigha (UP)' },
    BISWA: { factor: 126.464263, label: 'Biswa (UP, 1/20 Pucca Bigha)' },
    BISWANSI: { factor: 6.323213, label: 'Biswansi (UP, 1/20 Biswa)' },
    DEFAULT_BIGHA_TYPE: 'PUCCA_BIGHA',
    AMBIGUOUS_UNITS: ['BIGHA'],
  },
  // Bihar (State LGD: 10)
  '10': {
    BIGHA: { factor: 2528.8, label: 'Bigha (Bihar Standard)' },
    KATHA: { factor: 126.44, label: 'Katha (Bihar, 1/20 Bigha)' },
    DHUR: { factor: 6.322, label: 'Dhur (Bihar, 1/20 Katha)' },
  },
  // West Bengal (State LGD: 19)
  '19': {
    BIGHA: { factor: 1337.803776, label: 'Bigha (Bengal Standard - 14,400 sq ft)' },
    KATHA: { factor: 66.8901888, label: 'Katha (Bengal - 720 sq ft)' },
    CHATAK: { factor: 4.1806368, label: 'Chatak (Bengal - 45 sq ft)' },
  },
  // Assam (State LGD: 18)
  '18': {
    BIGHA: { factor: 1337.803776, label: 'Bigha (Assam Standard)' },
    KATHA: { factor: 267.560755, label: 'Katha (Assam, 1/5 Bigha)' },
    LESSA: { factor: 13.378038, label: 'Lessa (Assam, 1/20 Katha)' },
  },
  // Maharashtra (State LGD: 27) & Gujarat (24) & Karnataka (29) & Telangana (36)
  '27': {
    GUNTHA: { factor: 101.17141, label: 'Guntha (Maharashtra - 1,089 sq ft)' },
    ANNA: { factor: 252.9285, label: 'Anna (Maharashtra)' },
  },
  '29': {
    GUNTHA: { factor: 101.17141, label: 'Guntha (Karnataka - 1,089 sq ft)' },
    CENT: { factor: 40.46856, label: 'Cent (Karnataka - 435.6 sq ft)' },
  },
  // Tamil Nadu (State LGD: 33) & Kerala (32)
  '33': {
    CENT: { factor: 40.468564, label: 'Cent (Tamil Nadu - 435.6 sq ft)' },
    GROUND: { factor: 222.967296, label: 'Ground (Tamil Nadu - 2,400 sq ft)' },
    ANKANAM: { factor: 6.689018, label: 'Ankanam (72 sq ft)' },
  },
  // Punjab (State LGD: 03) & Haryana (06)
  '03': {
    KANAL: { factor: 505.857053, label: 'Kanal (Punjab - 5,445 sq ft)' },
    MARLA: { factor: 25.292853, label: 'Marla (Punjab - 272.25 sq ft)' },
    SARSAHI: { factor: 2.810317, label: 'Sarsahi (Punjab)' },
  },
  // Rajasthan (State LGD: 08)
  '08': {
    PUCCA_BIGHA: { factor: 2529.285264, label: 'Pucca Bigha (Rajasthan)' },
    KUCCHA_BIGHA: { factor: 1618.742569, label: 'Kuccha Bigha (Rajasthan - 17,424 sq ft)' },
    BISWA: { factor: 126.464263, label: 'Biswa (Rajasthan)' },
    DEFAULT_BIGHA_TYPE: 'PUCCA_BIGHA',
    AMBIGUOUS_UNITS: ['BIGHA'],
  },
  // Himachal Pradesh (State LGD: 02)
  '02': {
    BIGHA: { factor: 809.371284, label: 'Bigha (Himachal - 8,712 sq ft)' },
    BISWA: { factor: 40.468564, label: 'Biswa (Himachal - 1/20 Bigha)' },
    BISWANSI: { factor: 2.023428, label: 'Biswansi (Himachal)' },
  },
};

/**
 * Clean & normalize unit name string
 */
export const sanitizeUnitName = (unitStr) => {
  if (!unitStr) return '';
  return unitStr
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_');
};

/**
 * Main Conversion Function
 * @param {number} rawValue - Numerical value extracted from scan (e.g. 2.5)
 * @param {string} rawUnit - Extracted unit string (e.g. 'Bigha', 'Guntha', 'Cent', 'Acre')
 * @param {string} stateLgd - 2-digit State LGD Code (e.g. '09' for UP, '27' for Maharashtra)
 * @param {string} districtLgd - Optional District LGD code for granular local custom rules
 */
export const convertLandArea = (rawValue, rawUnit, stateLgd = '09', districtLgd = null) => {
  const value = parseFloat(rawValue);
  if (isNaN(value) || value <= 0) {
    throw new Error(`Invalid area value: "${rawValue}". Must be a positive number.`);
  }

  const cleanUnit = sanitizeUnitName(rawUnit);
  let factorInSqm = null;
  let ruleApplied = null;
  let isAmbiguous = false;
  let disambiguationOptions = null;

  // 1. Check Standard Metric / Imperial Units first
  if (cleanUnit.includes('HECTARE') || cleanUnit === 'HA') {
    factorInSqm = STANDARD_METRIC_FACTORS.HECTARE;
    ruleApplied = 'Standard Hectare (10,000 m²)';
  } else if (cleanUnit.includes('ACRE')) {
    factorInSqm = STANDARD_METRIC_FACTORS.ACRE;
    ruleApplied = 'Standard Acre (4,046.86 m²)';
  } else if (cleanUnit.includes('SQ_METER') || cleanUnit === 'SQM' || cleanUnit === 'M2') {
    factorInSqm = STANDARD_METRIC_FACTORS.SQ_METER;
    ruleApplied = 'Square Meters (1.0 m²)';
  } else if (cleanUnit.includes('SQ_FEET') || cleanUnit === 'SQFT') {
    factorInSqm = STANDARD_METRIC_FACTORS.SQ_FEET;
    ruleApplied = 'Square Feet (0.0929 m²)';
  }

  // 2. Regional Lookups based on State LGD
  if (!factorInSqm) {
    const stateRules = REGIONAL_UNIT_RULES[stateLgd] || REGIONAL_UNIT_RULES['09']; // default to UP if state not yet mapped

    // Handle generic "BIGHA" ambiguity in states with Pucca vs Kuccha
    if (cleanUnit === 'BIGHA' && stateRules.AMBIGUOUS_UNITS?.includes('BIGHA')) {
      isAmbiguous = true;
      const defaultBighaKey = stateRules.DEFAULT_BIGHA_TYPE || 'PUCCA_BIGHA';
      factorInSqm = stateRules[defaultBighaKey].factor;
      ruleApplied = `${stateRules[defaultBighaKey].label} [Default Applied; Ambiguous]`;

      // Provide both options for Human-in-the-Loop review confirmation
      disambiguationOptions = [
        {
          key: 'PUCCA_BIGHA',
          label: 'Pucca Bigha',
          sqm: parseFloat((value * stateRules.PUCCA_BIGHA.factor).toFixed(4)),
          hectares: parseFloat(((value * stateRules.PUCCA_BIGHA.factor) / 10000.0).toFixed(6)),
        },
        {
          key: 'KUCCHA_BIGHA',
          label: 'Kuccha Bigha',
          sqm: parseFloat((value * stateRules.KUCCHA_BIGHA.factor).toFixed(4)),
          hectares: parseFloat(((value * stateRules.KUCCHA_BIGHA.factor) / 10000.0).toFixed(6)),
        },
      ];
    } else if (stateRules[cleanUnit]) {
      factorInSqm = stateRules[cleanUnit].factor;
      ruleApplied = stateRules[cleanUnit].label;
    } else {
      // Fallback: search all states for exact unit name match (e.g. GUNTHA, CENT, KANAL)
      for (const [st, rules] of Object.entries(REGIONAL_UNIT_RULES)) {
        if (rules[cleanUnit]) {
          factorInSqm = rules[cleanUnit].factor;
          ruleApplied = `${rules[cleanUnit].label} (Inferred from State ${st})`;
          break;
        }
      }
    }
  }

  // If still not matched, fallback to standard Acre with an uncertainty flag
  if (!factorInSqm) {
    factorInSqm = STANDARD_METRIC_FACTORS.ACRE;
    ruleApplied = `Unrecognized unit "${rawUnit}". Defaulted to Acre. Requires Manual Review.`;
    isAmbiguous = true;
  }

  const normalizedSqm = parseFloat((value * factorInSqm).toFixed(4));
  const normalizedHectares = parseFloat((normalizedSqm / 10000.0).toFixed(6));

  return {
    rawValue: value,
    rawUnit: rawUnit,
    normalizedAreaSqm: normalizedSqm,
    normalizedAreaHectares: normalizedHectares,
    conversionMultiplier: factorInSqm,
    ruleApplied,
    isAmbiguous,
    disambiguationOptions,
    stateLgd,
    districtLgd,
  };
};

export default {
  convertLandArea,
  STANDARD_METRIC_FACTORS,
  REGIONAL_UNIT_RULES,
  sanitizeUnitName,
};
