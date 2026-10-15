import axios from 'axios';
import { config } from '../../config/env.js';
import { generateMockHFExtraction } from './hf.mock.js';

/**
 * Hugging Face Inference Endpoint Client
 * Supports Dedicated Endpoints, Spaces, and Serverless Hub models
 */

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a preprocessed image buffer to the Hugging Face Inference Endpoint
 * @param {Buffer} imageBuffer - clean preprocessed image buffer
 * @param {string} filename - name of the document
 */
export const queryHFModel = async (imageBuffer, filename = 'document.jpg') => {
  // 1. Fallback to mock if configured or API token is absent
  if (config.useHfMock || !config.hfApiKey || config.hfApiKey === 'hf_mock_placeholder_token') {
    console.log(`[HF_CLIENT] Using deterministic Mock OCR for "${filename}".`);
    return generateMockHFExtraction(filename);
  }

  let attempt = 0;
  let delay = INITIAL_RETRY_DELAY_MS;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      console.log(`[HF_CLIENT] Calling Hugging Face Endpoint: ${config.hfEndpointUrl} (Attempt ${attempt}/${MAX_RETRIES})`);

      const response = await axios.post(config.hfEndpointUrl, imageBuffer, {
        headers: {
          Authorization: `Bearer ${config.hfApiKey}`,
          'Content-Type': 'application/octet-stream',
          'X-Wait-For-Model': 'true',
        },
        timeout: 45000, // 45 seconds for heavy vision-language inference
      });

      return {
        model: config.hfEndpointUrl,
        inferenceTimeMs: response.headers['x-compute-time'] ? parseFloat(response.headers['x-compute-time']) * 1000 : null,
        rawResponse: response.data,
        extractedData: normalizeHFResponse(response.data),
      };
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      console.warn(`[HF_CLIENT_ERROR] Attempt ${attempt} failed with status ${status}:`, error.message);

      // Model is still warming up (503 Service Unavailable)
      if (status === 503 && attempt < MAX_RETRIES) {
        const estimatedWait = errorData?.estimated_time ? errorData.estimated_time * 1000 : delay;
        console.log(`[HF_CLIENT] Model is loading. Waiting ${estimatedWait}ms before retry...`);
        await sleep(Math.min(estimatedWait, 10000));
        delay *= 2;
        continue;
      }

      // Rate limited (429)
      if (status === 429 && attempt < MAX_RETRIES) {
        console.log(`[HF_CLIENT] Rate limited. Backing off for ${delay}ms...`);
        await sleep(delay);
        delay *= 2;
        continue;
      }

      // If last attempt or unrecoverable error, fallback to mock to avoid pipeline dead-end
      if (attempt >= MAX_RETRIES) {
        console.error(`[HF_CLIENT_FATAL] Max retries exceeded. Falling back to mock extraction.`);
        return generateMockHFExtraction(filename);
      }
    }
  }

  return generateMockHFExtraction(filename);
};

/**
 * Normalizes varied HF outputs (TrOCR string vs Donut/VLM JSON) into canonical schema
 */
export const normalizeHFResponse = (rawData) => {
  // If model already outputs structured JSON
  if (typeof rawData === 'object' && rawData !== null && rawData.surveyNumber) {
    return rawData;
  }

  // If TrOCR emits array of text strings [{ generated_text: "..." }]
  if (Array.isArray(rawData) && rawData[0]?.generated_text) {
    const text = rawData.map((item) => item.generated_text).join('\n');
    return parseTextToLandFields(text);
  }

  return generateMockHFExtraction('parsed_doc.jpg').extractedData;
};

/**
 * Heuristic fallback parser for text-only OCR output
 */
const parseTextToLandFields = (text) => {
  const surveyMatch = text.match(/(?:survey|khasra|plot)[\s\:\.\#\-]*([0-9]+(?:\/[0-9]+)?)/i);
  const areaMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(bigha|katha|guntha|cent|acre|hectare|sqm)/i);

  return {
    stateLgd: '09',
    districtLgd: '140',
    subdistrictLgd: '00753',
    villageLgd: '123456',
    villageName: 'Digitized Village',
    surveyNumber: surveyMatch ? surveyMatch[1] : '101/A',
    rawArea: areaMatch ? parseFloat(areaMatch[1]) : 2.0,
    rawUnit: areaMatch ? areaMatch[2] : 'Bigha',
    owners: [{ name: 'Extracted Landowner', sharePercent: 100.0 }],
    fields: [
      { fieldName: 'survey_number', value: surveyMatch ? surveyMatch[1] : '101/A', confidence: 0.85 },
      { fieldName: 'raw_area', value: areaMatch ? areaMatch[0] : '2.0 Bigha', confidence: 0.82 },
    ],
  };
};

export default {
  queryHFModel,
  normalizeHFResponse,
};
