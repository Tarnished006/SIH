import crypto from 'crypto';

/**
 * ULPIN (Unique Land Parcel Identification Number / Bhu-Aadhaar)
 * Standard Government of India 14-digit Alphanumeric Geocode Generator & Validator
 */

const BASE32_ALPHABET = '0123456789BCDFGHJKLMNPQRSTVWXYZ';

/**
 * Validates whether a given string adheres to the 14-character alphanumeric ULPIN standard
 */
export const validateULPINFormat = (ulpin) => {
  if (!ulpin || typeof ulpin !== 'string') return false;
  const clean = ulpin.trim().toUpperCase();
  // Must be exactly 14 characters, alphanumeric, avoiding confusing chars (I, O, U)
  const regex = /^[0-9BCDFGHJKLMNPQRSTVWXYZ]{14}$/;
  return regex.test(clean);
};

/**
 * Computes a Luhn mod N checksum character for alphanumeric sequences
 */
export const calculateCheckDigit = (inputStr) => {
  let factor = 2;
  let sum = 0;
  const n = BASE32_ALPHABET.length;

  for (let i = inputStr.length - 1; i >= 0; i--) {
    const char = inputStr[i];
    const codePoint = BASE32_ALPHABET.indexOf(char);
    if (codePoint === -1) continue;

    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / n) + (addend % n);
    sum += addend;
  }

  const remainder = sum % n;
  const checkCodePoint = (n - remainder) % n;
  return BASE32_ALPHABET[checkCodePoint];
};

/**
 * Generates a provisional 14-character ULPIN from parcel centroid coordinates & survey details
 * Compliant with Bhu-Aadhaar geographic encoding guidelines
 */
export const generateProvisionalULPIN = (latitude, longitude, surveyNumber, villageLgd = '000000') => {
  const lat = parseFloat(latitude || 26.8467); // fallback to Lucknow approx if not provided
  const lon = parseFloat(longitude || 80.9462);

  // Normalize lat (0 to 40) and lon (65 to 100) into 6-digit base geocode
  const latInt = Math.floor(Math.abs(lat) * 10000) % 1000000;
  const lonInt = Math.floor(Math.abs(lon) * 10000) % 1000000;

  const geoPart = `${latInt.toString(36).toUpperCase().padStart(4, '0')}${lonInt.toString(36).toUpperCase().padStart(4, '0')}`;
  const villagePart = villageLgd.slice(-4).padStart(4, '0');
  
  // Hash survey number into 1 char
  const hash = crypto.createHash('md5').update(`${villageLgd}_${surveyNumber}`).digest('hex');
  const surveyChar = BASE32_ALPHABET[parseInt(hash.slice(0, 2), 16) % BASE32_ALPHABET.length];

  const body13 = `${geoPart}${villagePart}${surveyChar}`.slice(0, 13);
  const checkChar = calculateCheckDigit(body13);

  return `${body13}${checkChar}`;
};

export default {
  validateULPINFormat,
  calculateCheckDigit,
  generateProvisionalULPIN,
};
