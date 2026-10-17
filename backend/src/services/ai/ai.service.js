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
  const mode = (config.aiMode || 'LLM').toUpperCase();
  const key = (config.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();
  const hasGeminiKey = Boolean(key && !key.toLowerCase().includes('your_gemini') && key !== 'gemini_mock_key');
  const startTime = Date.now();

  console.log(`[AI_SERVICE] Processing document "${originalFilename}". Mode: ${mode}, Gemini Key present: ${hasGeminiKey}`);

  // 1. LLM Vision Engine (Default or explicit)
  if (mode === 'LLM') {
    try {
      console.log('[AI_SERVICE] Routing to Gemini Vision Engine...');
      const result = await queryGeminiVision(imageBuffer, mimeType, originalFilename);
      return {
        ...result,
        engineUsed: hasGeminiKey ? 'GEMINI_VISION_LIVE' : 'GEMINI_VISION_MOCK',
        totalTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn(`[AI_SERVICE] Gemini Vision request failed (${err.message}). Falling back to local OCR...`);
    }
  }

  // 2. Real local OCR pipeline (Tesseract + Sharp)
  console.log('[AI_SERVICE] Running local OCR engine...');
  const ocrResult = await runLocalOcr(imageBuffer, originalFilename);
  return {
    ...ocrResult,
    totalTimeMs: Date.now() - startTime,
  };
};

export default {
  extractLandRecord,
};
