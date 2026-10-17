import { config } from '../../config/env.js';
import { queryGeminiVision } from './gemini.client.js';
import { runLocalOcr } from './localOcr.service.js';

/**
 * Unified AI Extraction Service:
 * - If GEMINI_API_KEY is configured in backend environment: Uses Gemini Vision API
 * - Otherwise: Runs real local OCR using Tesseract.js & Sharp preprocessing
 * No hardcoded OCR outputs or simulated fake metrics.
 */
export const extractLandRecord = async (imageBuffer, originalFilename = 'document.jpg', mimeType = 'image/jpeg') => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  const hasGeminiKey = Boolean(key && !key.toLowerCase().includes('your_gemini') && key !== 'gemini_mock_key');
  const startTime = Date.now();

  console.log(`[AI_SERVICE] Processing document "${originalFilename}". Gemini Key valid: ${hasGeminiKey}`);

  if (hasGeminiKey) {
    try {
      console.log('[AI_SERVICE] Routing to Gemini Vision API...');
      const result = await queryGeminiVision(imageBuffer, mimeType, originalFilename);
      return {
        ...result,
        engineUsed: 'GEMINI_VISION',
        totalTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn(`[AI_SERVICE] Gemini Vision request failed (${err.message}). Falling back to local Tesseract OCR...`);
    }
  }

  // Real local OCR pipeline
  console.log('[AI_SERVICE] Running real local Tesseract OCR engine...');
  const ocrResult = await runLocalOcr(imageBuffer, originalFilename);
  return {
    ...ocrResult,
    totalTimeMs: Date.now() - startTime,
  };
};

export default {
  extractLandRecord,
};
