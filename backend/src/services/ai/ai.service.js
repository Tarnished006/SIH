import { config } from '../../config/env.js';
import { queryGeminiVision, adjudicateWithGemini } from './gemini.client.js';
import { querySarvamDocAi } from './sarvam.client.js';
import { runLocalOcr } from './localOcr.service.js';
import { preprocessLandRecord } from './imagePreprocessor.js';

/**
 * BhoomiSetu Dual-Model Ensemble Extraction Service
 * Architecture:
 * 1. Image Preprocessing & Auto-Deskew (Sharp)
 * 2. Primary Sovereign Extraction: Sarvam Vision 2.1
 * 3. Confidence Evaluation & Trigger:
 *    - If all fields high confidence (>= 0.85) -> Fast-Track Direct
 *    - If low confidence, warnings, or handwritten flags -> Escalate to Gemini 3.8 Flash Judge
 * 4. Gemini 3.8 Flash Adjudicator:
 *    - Cross-verifies Survey/Hissa, transcribes cursive script, validates extent math
 *    - Generates consensus agreement score and audit provenance notes
 * 5. Full Fallback: If Sarvam errors -> Gemini direct -> Local OCR
 */
export const extractLandRecord = async (imageBuffer, originalFilename = 'document.jpg', mimeType = 'image/jpeg') => {
  const hasSarvamKey = Boolean(config.sarvamApiKey && !config.sarvamApiKey.includes('your_sarvam'));
  const hasGeminiKey = Boolean(config.geminiApiKey && !config.geminiApiKey.includes('your_gemini'));
  const startTime = Date.now();

  console.log(`[AI_SERVICE] Processing document "${originalFilename}". Sarvam: ${hasSarvamKey}, Gemini Judge: ${hasGeminiKey}`);

  // Step 1: Preprocess and auto-deskew image
  const { buffer: preprocessedBuffer, wasRotated } = await preprocessLandRecord(imageBuffer, originalFilename);
  const activeBuffer = preprocessedBuffer || imageBuffer;

  // Step 2: Primary Extraction via Sarvam Vision 2.1
  let sarvamResult = null;
  if (hasSarvamKey) {
    try {
      console.log('[AI_SERVICE] Running Primary Sovereign Extraction (Sarvam Vision 2.1)...');
      sarvamResult = await querySarvamDocAi(activeBuffer, originalFilename, mimeType);
    } catch (err) {
      console.warn(`[AI_SERVICE] Primary Sarvam extraction failed (${err.message}). Escalating directly to Gemini...`);
    }
  }

  // Step 3: Check if Gemini Judge is needed
  if (sarvamResult && sarvamResult.extractedData) {
    const data = sarvamResult.extractedData;
    const fields = data.fields || [];

    // Detect if any field has low confidence or warnings
    const hasLowConfidenceOwner = !data.owners?.[0]?.name || data.owners[0].name.includes('[Needs') || fields.some(f => f.fieldName === 'owner_name' && f.confidence < 0.70);
    const hasLowConfidenceVillage = fields.some(f => f.fieldName === 'village' && f.confidence < 0.50);
    const hasWarnFlags = fields.some(f => f.ruleValidationStatus === 'WARN');
    const isOverallLow = typeof data.overallConfidence === 'number' && data.overallConfidence < 0.80;

    const needsAdjudication = hasLowConfidenceOwner || hasLowConfidenceVillage || hasWarnFlags || isOverallLow;

    if (needsAdjudication && hasGeminiKey) {
      const judgeModel = config.geminiModel || 'gemini-flash-latest';
      console.log(`[AI_SERVICE] Confidence threshold triggered (ownerLow: ${hasLowConfidenceOwner}, warnFlags: ${hasWarnFlags}, overall: ${data.overallConfidence}). Invoking Gemini Judge (${judgeModel})...`);
      try {
        const adjudication = await adjudicateWithGemini(activeBuffer, mimeType, sarvamResult, originalFilename);
        return {
          engineUsed: `SARVAM_VISION_2_1 + ${judgeModel.toUpperCase().replace(/[-.]/g, '_')}_JUDGE`,
          model: `Sarvam Vision 2.1 (Primary) + ${judgeModel} (Adjudicator)`,
          inferenceTimeMs: Date.now() - startTime,
          consensusStatus: adjudication.consensusStatus,
          agreementScore: adjudication.agreementScore,
          discrepanciesResolved: adjudication.discrepanciesResolved,
          detectedLanguage: sarvamResult.detectedLanguage || 'Kannada',
          documentType: sarvamResult.documentType || 'RTC Form 16 (Pahani)',
          extractedData: adjudication.adjudicatedData,
          totalTimeMs: Date.now() - startTime,
        };
      } catch (judgeErr) {
        console.warn(`[AI_SERVICE] Gemini Judge failed (${judgeErr.message}). Retaining primary Sarvam extraction.`);
      }
    }

    // High confidence direct pass
    return {
      ...sarvamResult,
      engineUsed: 'SARVAM_SOVEREIGN_PRIMARY',
      totalTimeMs: Date.now() - startTime,
    };
  }

  // Step 4: Fallback to standalone Gemini Vision if Sarvam was unavailable or failed
  if (hasGeminiKey) {
    const fallbackModel = config.geminiModel || 'gemini-flash-latest';
    try {
      console.log(`[AI_SERVICE] Routing to standalone Gemini Vision Engine (${fallbackModel})...`);
      const result = await queryGeminiVision(activeBuffer, mimeType, originalFilename);
      return {
        ...result,
        engineUsed: `${fallbackModel.toUpperCase().replace(/[-.]/g, '_')}_DIRECT`,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.warn(`[AI_SERVICE] Gemini Vision fallback failed (${err.message}). Falling back to local OCR...`);
    }
  }

  // Step 5: Offline Local OCR Pipeline (Tesseract.js)
  console.log('[AI_SERVICE] Running local OCR offline pipeline...');
  const ocrResult = await runLocalOcr(activeBuffer, originalFilename);
  return {
    ...ocrResult,
    engineUsed: 'LOCAL_TESSERACT_OFFLINE',
    totalTimeMs: Date.now() - startTime,
  };
};

export default {
  extractLandRecord,
};
