import AdmZip from 'adm-zip';
import { config } from '../../config/env.js';
import { queryGeminiVision } from './gemini.client.js';

const LAND_RECORD_SCHEMA = {
  type: 'object',
  properties: {
    survey_number: {
      type: 'string',
      description: 'The survey, khasra, or hissa number of the land parcel, e.g. 142/3A, 143/3, 84/2A',
    },
    owner_name: {
      type: 'string',
      description: 'The primary landholder, occupant, or khatedar name in original script and/or English transliteration',
    },
    land_extent: {
      type: 'string',
      description: 'Total land area/extent stated with units, e.g. 2 Acre 14 Gunta, 1.459 Hectare, 2.14 Acre',
    },
    village_name: {
      type: 'string',
      description: 'The revenue village, mauza, or hobli name, e.g. Thippagondanahalli, Rampur',
    },
    khata_number: {
      type: 'string',
      description: 'Account or khata number',
    },
    document_type: {
      type: 'string',
      description: 'The record type, e.g. RTC Form 16 (Pahani), Khasra, Khatauni, Sale Deed',
    },
    detected_language: {
      type: 'string',
      description: 'Primary language detected (Kannada, Hindi, English, Bilingual)',
    },
  },
  required: ['survey_number', 'owner_name', 'land_extent', 'village_name'],
};

const DEFAULT_BOUNDING_BOXES = {
  survey_number: { top: 16.5, left: 12.0, width: 36.0, height: 9.0 },
  owner_name: { top: 29.0, left: 12.0, width: 54.0, height: 9.5 },
  raw_area: { top: 43.0, left: 12.0, width: 44.0, height: 9.0 },
  village: { top: 57.0, left: 12.0, width: 40.0, height: 8.5 },
  khata_number: { top: 71.0, left: 12.0, width: 34.0, height: 8.0 },
};

/**
 * Query Sarvam AI Sovereign Document Intelligence (Sarvam Vision 2.1)
 * @param {Buffer} fileBuffer - Image or PDF buffer
 * @param {string} originalFilename - Name of the uploaded file
 * @param {string} mimeType - MIME type (image/jpeg, image/png, application/pdf)
 */
export const querySarvamDocAi = async (fileBuffer, originalFilename = 'document.jpg', mimeType = 'image/jpeg') => {
  const apiKey = (config.sarvamApiKey || process.env.SARVAM_API_KEY || '').trim();

  if (!apiKey || apiKey.includes('your_sarvam')) {
    console.warn('[SARVAM_AI] No valid SARVAM_API_KEY configured. Routing to Gemini Vision...');
    return queryGeminiVision(fileBuffer, mimeType, originalFilename);
  }

  const startTime = Date.now();
  console.log(`[SARVAM_AI] Initiating Sarvam Vision 2.1 extraction for "${originalFilename}" (${fileBuffer.length} bytes)...`);

  try {
    // 1. Prepare Multipart Form Request
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, originalFilename);
    formData.append('schema', JSON.stringify(LAND_RECORD_SCHEMA));

    // 2. Submit Extraction Job
    const createRes = await fetch('https://api.sarvam.ai/doc-ai/v1/job/extract', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: formData,
    });

    if (!createRes.ok) {
      const errBody = await createRes.text().catch(() => '');
      throw new Error(`Sarvam job creation failed (HTTP ${createRes.status}): ${errBody}`);
    }

    const createData = await createRes.json();
    const jobId = createData.job_id;

    if (!jobId) {
      throw new Error('Sarvam API did not return a job_id');
    }

    console.log(`[SARVAM_AI] Job ${jobId} accepted. Polling status...`);

    // 3. Poll Job Status (1.5s interval, max 20 attempts = 30 seconds)
    let completed = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const statusRes = await fetch(`https://api.sarvam.ai/doc-ai/v1/job/${jobId}/status`, {
        headers: { 'api-subscription-key': apiKey },
      });

      if (!statusRes.ok) continue;

      const statusData = await statusRes.json();
      console.log(`[SARVAM_AI] Job ${jobId} status [Attempt ${attempt + 1}]: ${statusData.status}`);

      if (statusData.status === 'completed' || statusData.status === 'partially_completed') {
        completed = true;
        break;
      }

      if (statusData.status === 'failed' || statusData.status === 'rejected') {
        throw new Error(`Sarvam extraction job failed with status: ${statusData.status}`);
      }
    }

    if (!completed) {
      throw new Error(`Sarvam extraction job ${jobId} timed out after 30 seconds`);
    }

    // 4. Fetch Download URL
    const dlRes = await fetch(`https://api.sarvam.ai/doc-ai/v1/job/${jobId}/download-url`, {
      headers: { 'api-subscription-key': apiKey },
    });

    if (!dlRes.ok) {
      throw new Error(`Failed to get download URL for Sarvam job ${jobId}`);
    }

    const dlData = await dlRes.json();
    const downloadUrl = dlData.download_url || dlData.url;

    if (!downloadUrl) {
      throw new Error('No download URL returned by Sarvam');
    }

    // 5. Download Output ZIP and Extract extraction.json
    console.log(`[SARVAM_AI] Downloading output archive for job ${jobId}...`);
    const zipRes = await fetch(downloadUrl);
    const zipArrayBuffer = await zipRes.arrayBuffer();
    const zip = new AdmZip(Buffer.from(zipArrayBuffer));

    const extractionEntry = zip.getEntry('extraction.json');
    if (!extractionEntry) {
      throw new Error('extraction.json missing from Sarvam output archive');
    }

    const extractionJson = JSON.parse(extractionEntry.getData().toString('utf8'));
    console.log('[SARVAM_AI] Extraction payload successfully parsed!');

    const elapsedMs = Date.now() - startTime;
    return normalizeSarvamOutput(extractionJson, originalFilename, elapsedMs);
  } catch (error) {
    console.warn(`[SARVAM_AI_ERROR] ${error.message}. Escalating to Gemini Vision fallback...`);
    const fallbackRes = await queryGeminiVision(fileBuffer, mimeType, originalFilename);
    return {
      ...fallbackRes,
      engineUsed: 'GEMINI_FALLBACK',
      note: `Sarvam AI escalation: ${error.message}`,
    };
  }
};

/**
 * Normalizes Sarvam Doc AI output into the canonical BhoomiSetu schema
 */
export const normalizeSarvamOutput = (sarvamData, filename, elapsedMs) => {
  const d = sarvamData.data || {};
  const conf = sarvamData.field_confidence || {};

  const surveyNumber = d.survey_number ? String(d.survey_number).trim() : 'Unassigned';
  const ownerName = d.owner_name ? String(d.owner_name).trim() : '[Needs Manual Verification]';
  const villageName = d.village_name ? String(d.village_name).trim() : '[Unspecified Village]';
  const rawAreaStr = d.land_extent ? String(d.land_extent).trim() : '0.0 Acre';

  // Parse numerical extent (Handles Karnataka "Acres-Guntas" notation e.g., 15-35 = 15 Acres 35 Guntas)
  let rawAreaNum = 0;
  const acreGuntaMatch = rawAreaStr.match(/^(\d+)[-–—\.](\d+)$/);
  if (acreGuntaMatch) {
    const acres = parseInt(acreGuntaMatch[1], 10);
    const guntas = parseInt(acreGuntaMatch[2], 10);
    rawAreaNum = Number((acres + guntas / 40).toFixed(4));
  } else {
    const areaMatch = rawAreaStr.match(/([\d\.]+)/);
    rawAreaNum = areaMatch ? parseFloat(areaMatch[1]) : 0;
  }

  const rawUnit = rawAreaStr.toLowerCase().includes('ha')
    ? 'Hectare'
    : rawAreaStr.toLowerCase().includes('gunta')
    ? 'Gunta'
    : 'Acre';

  const hasOwner = d.owner_name && d.owner_name.trim().length > 0;
  const owners = [
    {
      name: ownerName,
      nameEnglish: ownerName,
      sharePercent: 100.0,
      relationship: 'self',
    },
  ];

  const surveyConf = typeof conf.survey_number === 'number' && conf.survey_number > 0 ? conf.survey_number : (d.survey_number ? 0.90 : 0.20);
  const ownerConf = typeof conf.owner_name === 'number' && conf.owner_name > 0 ? conf.owner_name : (hasOwner ? 0.85 : 0.15);
  const areaConf = typeof conf.land_extent === 'number' && conf.land_extent > 0 ? conf.land_extent : (d.land_extent ? 0.88 : 0.20);
  const villageConf = typeof conf.village_name === 'number' && conf.village_name > 0 ? conf.village_name : (d.village_name ? 0.70 : 0.20);
  const khataConf = typeof conf.khata_number === 'number' && conf.khata_number > 0 ? conf.khata_number : (d.khata_number ? 0.85 : 0.20);

  const fields = [
    {
      id: 'fe-sarvam-1',
      fieldName: 'survey_number',
      value: surveyNumber,
      confidence: surveyConf,
      boundingBox: DEFAULT_BOUNDING_BOXES.survey_number,
      ruleValidationStatus: surveyConf < 0.7 ? 'WARN' : 'PASS',
      ruleValidationMessage: surveyConf < 0.7 ? 'Low survey number confidence. Verification recommended.' : null,
    },
    {
      id: 'fe-sarvam-2',
      fieldName: 'owner_name',
      value: ownerName,
      confidence: ownerConf,
      boundingBox: DEFAULT_BOUNDING_BOXES.owner_name,
      ruleValidationStatus: ownerConf < 0.7 ? 'WARN' : 'PASS',
      ruleValidationMessage: ownerConf < 0.7 ? 'Handwritten/unclear owner script detected. Requires verification.' : null,
    },
    {
      id: 'fe-sarvam-3',
      fieldName: 'raw_area',
      value: rawAreaStr,
      confidence: areaConf,
      boundingBox: DEFAULT_BOUNDING_BOXES.raw_area,
      ruleValidationStatus: areaConf < 0.7 ? 'WARN' : 'PASS',
      ruleValidationMessage: areaConf < 0.7 ? 'Area extent requires verification.' : null,
    },
    {
      id: 'fe-sarvam-4',
      fieldName: 'village',
      value: villageName,
      confidence: villageConf,
      boundingBox: DEFAULT_BOUNDING_BOXES.village,
      ruleValidationStatus: villageConf < 0.5 ? 'WARN' : 'PASS',
      ruleValidationMessage: villageConf < 0.5 ? 'Low village name character confidence.' : null,
    },
    {
      id: 'fe-sarvam-5',
      fieldName: 'khata_number',
      value: d.khata_number ? String(d.khata_number) : '[Pending]',
      confidence: khataConf,
      boundingBox: DEFAULT_BOUNDING_BOXES.khata_number,
      ruleValidationStatus: khataConf < 0.7 ? 'WARN' : 'PASS',
    },
  ];

  const overallConfidence = Number(((surveyConf + ownerConf + areaConf + villageConf + khataConf) / 5).toFixed(2));

  return {
    engineUsed: 'SARVAM_VISION_2_1',
    model: 'Sarvam Vision 2.1 (doc-ai/extract)',
    inferenceTimeMs: elapsedMs,
    detectedLanguage: d.detected_language || 'Kannada',
    documentType: d.document_type || 'RTC Form 16 (Pahani)',
    extractedData: {
      stateLgd: '29',
      districtLgd: '572',
      villageName,
      villageLgd: '572',
      surveyNumber,
      rawArea: rawAreaNum,
      rawUnit,
      owners,
      landClassification: 'Dry Agricultural / Patta Land',
      overallConfidence,
      fields,
    },
    rawResponse: sarvamData,
  };
};

export default {
  querySarvamDocAi,
};
