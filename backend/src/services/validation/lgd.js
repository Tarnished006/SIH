/**
 * Local Government Directory (LGD) Reference & Validator
 */

export const KNOWN_STATES_LGD = {
  '01': { name: 'JAMMU AND KASHMIR', short: 'JK' },
  '02': { name: 'HIMACHAL PRADESH', short: 'HP' },
  '03': { name: 'PUNJAB', short: 'PB' },
  '06': { name: 'HARYANA', short: 'HR' },
  '07': { name: 'DELHI', short: 'DL' },
  '08': { name: 'RAJASTHAN', short: 'RJ' },
  '09': { name: 'UTTAR PRADESH', short: 'UP' },
  '10': { name: 'BIHAR', short: 'BR' },
  '18': { name: 'ASSAM', short: 'AS' },
  '19': { name: 'WEST BENGAL', short: 'WB' },
  '24': { name: 'GUJARAT', short: 'GJ' },
  '27': { name: 'MAHARASHTRA', short: 'MH' },
  '29': { name: 'KARNATAKA', short: 'KA' },
  '32': { name: 'KERALA', short: 'KL' },
  '33': { name: 'TAMIL NADU', short: 'TN' },
  '36': { name: 'TELANGANA', short: 'TG' },
};

export const validateLgdCode = (code, type = 'STATE') => {
  if (!code || typeof code !== 'string') return false;
  const clean = code.trim();

  if (type === 'STATE') {
    return Boolean(KNOWN_STATES_LGD[clean.padStart(2, '0')]);
  }
  // Generic numeric check for district, tehsil, and village LGD codes
  return /^\d{2,8}$/.test(clean);
};

export const validateSurveyNumberFormat = (surveyNo) => {
  if (!surveyNo || typeof surveyNo !== 'string') return false;
  const clean = surveyNo.trim();
  // Valid patterns: "142", "142/1", "142/1/A", "45-B", "Khasra 203"
  const regex = /^[A-Za-z0-9\/\-\.\s]{1,50}$/;
  return regex.test(clean);
};

export default {
  KNOWN_STATES_LGD,
  validateLgdCode,
  validateSurveyNumberFormat,
};
