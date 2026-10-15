import { config } from '../../config/env.js';
import { queryGeminiVision } from './gemini.client.js';
import { queryHFModel } from '../huggingface/hf.client.js';

/**
 * Unified AI Extraction Service supporting Dual Mode Architecture:
 * - 'LLM': Direct Vision-Language Model inference (Gemini 1.5 Flash/Pro) - ACTIVE DEFAULT
 * - 'LOCAL_MODEL': On-premise / Hugging Face fine-tuned adapter (Qwen2-VL / TrOCR) - EDGE MODE
 * - 'HYBRID': Run local model first; if confidence < threshold, automatically route to LLM fallback
 * - 'MOCK': Offline deterministic test output
 */
export const extractLandRecord = async (imageBuffer, originalFilename = 'document.jpg', mimeType = 'image/jpeg') => {
  const mode = (config.aiMode || 'LLM').toUpperCase();
  console.log(`[AI_SERVICE] Processing document "${originalFilename}" in mode: ${mode}`);

  const startTime = Date.now();

  try {
    switch (mode) {
      case 'LLM': {
        // High-precision Cloud VLM (Gemini) for Language detection & multi-line extraction
        const result = await queryGeminiVision(imageBuffer, mimeType, originalFilename);
        return {
          ...result,
          engineUsed: 'VISION_LLM',
          mode: 'LLM',
          totalTimeMs: Date.now() - startTime,
        };
      }

      case 'LOCAL_MODEL': {
        // On-premise fine-tuned model (e.g., Qwen2-VL / TrOCR)
        console.log(`[AI_SERVICE] Routing to Local Fine-Tuned Model: ${config.hfEndpointUrl}`);
        const result = await queryHFModel(imageBuffer, originalFilename);
        return {
          ...result,
          engineUsed: 'LOCAL_FINE_TUNED_MODEL',
          mode: 'LOCAL_MODEL',
          totalTimeMs: Date.now() - startTime,
        };
      }

      case 'HYBRID': {
        // Two-Tier Confidence-Gated Routing:
        // Tier 1: Attempt local on-premise model first
        console.log(`[AI_SERVICE_HYBRID] Tier 1: Executing local fine-tuned model...`);
        const localResult = await queryHFModel(imageBuffer, originalFilename);
        const overallConf = localResult.extractedData?.overallConfidence || 0;
        const threshold = config.hybridThreshold || 0.70;

        console.log(`[AI_SERVICE_HYBRID] Tier 1 Overall Confidence: ${overallConf} (Threshold: ${threshold})`);

        if (overallConf >= threshold) {
          console.log(`[AI_SERVICE_HYBRID] High confidence achieved on-premise. No cloud call needed.`);
          return {
            ...localResult,
            engineUsed: 'LOCAL_FINE_TUNED_MODEL',
            mode: 'HYBRID_TIER_1',
            totalTimeMs: Date.now() - startTime,
          };
        }

        // Tier 2: Low confidence or blurred image -> seamless fallback to Vision LLM
        console.log(`[AI_SERVICE_HYBRID] Tier 2: Confidence below threshold. Escalating to Vision LLM fallback...`);
        const llmResult = await queryGeminiVision(imageBuffer, mimeType, originalFilename);
        return {
          ...llmResult,
          engineUsed: 'VISION_LLM_FALLBACK',
          mode: 'HYBRID_TIER_2',
          tier1Confidence: overallConf,
          totalTimeMs: Date.now() - startTime,
        };
      }

      case 'MOCK':
      default: {
        const mockResult = await queryGeminiVision(imageBuffer, mimeType, originalFilename);
        return {
          ...mockResult,
          engineUsed: 'MOCK_ENGINE',
          mode: 'MOCK',
          totalTimeMs: Date.now() - startTime,
        };
      }
    }
  } catch (error) {
    console.error(`[AI_SERVICE_ERROR] Extraction failed in mode ${mode}:`, error);
    // Graceful fallback to Gemini mock to ensure pipeline continuity
    const fallback = await queryGeminiVision(imageBuffer, mimeType, originalFilename);
    return {
      ...fallback,
      engineUsed: 'FALLBACK_MOCK',
      error: error.message,
      totalTimeMs: Date.now() - startTime,
    };
  }
};

export default {
  extractLandRecord,
};
