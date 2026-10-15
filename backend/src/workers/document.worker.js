import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { redisConnection } from '../config/redis.js';
import { getObjectBuffer, uploadBuffer } from '../config/s3.js';
import { preprocessScan } from '../services/preprocessing/image.processor.js';
import { queryHFModel } from '../services/huggingface/hf.client.js';
import { convertLandArea } from '../services/validation/unitConverter.js';
import { generateProvisionalULPIN } from '../services/validation/ulpin.js';
import { runComprehensiveValidation } from '../services/validation/rulesEngine.js';
import { scoreField, scoreDocument } from '../services/scoring/confidenceScorer.js';
import { appendAuditLog } from '../services/audit/hashChain.js';

/**
 * Core End-to-End Ingestion, AI Inference & Validation Pipeline (Prisma ORM)
 */
export const processDocumentPipeline = async (jobData) => {
  const { documentId, s3Key, originalFilename, uploadedBy, stateLgd = '09', districtLgd = '140' } = jobData;
  console.log(`[PIPELINE_START] Processing Document ID: ${documentId} (${originalFilename})`);

  try {
    // 1. Fetch raw image from S3 / MinIO
    const rawBuffer = await getObjectBuffer(s3Key);

    // 2. Preprocessing via Sharp (Grayscale, Contrast normalization, Denoise)
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PREPROCESSING' },
    });
    const preprocessed = await preprocessScan(rawBuffer);

    // Save preprocessed clean image back to storage
    const preprocessedKey = `preprocessed/${documentId}_clean.jpg`;
    await uploadBuffer(preprocessedKey, preprocessed.processedBuffer, 'image/jpeg');
    await prisma.document.update({
      where: { id: documentId },
      data: { preprocessedS3Key: preprocessedKey },
    });

    // 3. Hugging Face Model Inference
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'INFERENCE' },
    });
    const hfResult = await queryHFModel(preprocessed.processedBuffer, originalFilename);
    const extracted = hfResult.extractedData;

    // 4. Multi-Region Land Unit Normalization
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'VALIDATING' },
    });
    const unitConversion = convertLandArea(
      extracted.rawArea,
      extracted.rawUnit,
      extracted.stateLgd || stateLgd,
      extracted.districtLgd || districtLgd
    );

    // 5. Provisional ULPIN (Bhu-Aadhaar) Generation
    const provisionalUlpin = generateProvisionalULPIN(
      extracted.centroid?.latitude,
      extracted.centroid?.longitude,
      extracted.surveyNumber,
      extracted.villageLgd || '123456'
    );

    // 6. Comprehensive Rules Validation Suite
    const validationResults = runComprehensiveValidation({
      surveyNumber: extracted.surveyNumber,
      owners: extracted.owners,
      normalizedAreaSqm: unitConversion.normalizedAreaSqm,
      isAmbiguousUnit: unitConversion.isAmbiguous,
    });

    // 7. Field-level explainable scoring
    const fieldScores = (extracted.fields || []).map((f) => {
      const isFieldRulePassed = f.fieldName === 'area' ? !unitConversion.isAmbiguous : true;
      return scoreField(f.confidence, preprocessed.imageQualityScore, isFieldRulePassed, f.fieldName);
    });

    const docScore = scoreDocument(fieldScores, validationResults);

    // 8. Persist Normalized Record into PostgreSQL using Prisma
    const record = await prisma.landRecord.create({
      data: {
        documentId,
        stateLgd: extracted.stateLgd || stateLgd,
        districtLgd: extracted.districtLgd || districtLgd,
        subdistrictLgd: extracted.subdistrictLgd || '001',
        villageLgd: extracted.villageLgd || '123456',
        villageName: extracted.villageName || 'Demo Village',
        surveyNumber: extracted.surveyNumber,
        subdivisionNumber: extracted.subdivisionNumber || '1',
        ulpin: provisionalUlpin,
        rawArea: unitConversion.rawValue,
        rawUnit: unitConversion.rawUnit,
        normalizedAreaSqm: unitConversion.normalizedAreaSqm,
        normalizedAreaHectares: unitConversion.normalizedAreaHectares,
        unitConversionMetadata: unitConversion,
        landClassification: extracted.landClassification || 'Agricultural',
        owners: extracted.owners,
        overallConfidence: docScore.overallConfidence,
        reviewPriorityScore: docScore.reviewPriorityScore,
        reviewStatus: 'PENDING_REVIEW',
      },
    });

    const recordId = record.id;

    // 9. Persist Individual Field Extractions via Prisma createMany
    if (extracted.fields && extracted.fields.length > 0) {
      await prisma.fieldExtraction.createMany({
        data: extracted.fields.map((field, i) => {
          const score = fieldScores[i];
          return {
            recordId,
            fieldName: field.fieldName,
            aiExtractedValue: field.value,
            aiConfidence: field.confidence,
            boundingBox: field.boundingBox || [],
            ruleValidationStatus: score.classification === 'MATCH' ? 'PASS' : score.classification === 'UNCERTAIN' ? 'WARNING' : 'FAIL',
            ruleValidationMessage: score.rationale,
          };
        }),
      });
    }

    // 10. Record Tamper-Evident Genesis Audit Block for this Record
    await appendAuditLog({
      recordId,
      actorId: uploadedBy || null,
      actorRole: 'SYSTEM_AI',
      action: 'RECORD_DIGITIZED_BY_AI',
      delta: {
        documentId,
        surveyNumber: extracted.surveyNumber,
        ulpin: provisionalUlpin,
        normalizedAreaHectares: unitConversion.normalizedAreaHectares,
        reviewPriorityScore: docScore.reviewPriorityScore,
        validationFlags: validationResults.flags,
      },
    });

    // 11. Finalize Document Status
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'READY_FOR_REVIEW' },
    });

    console.log(`[PIPELINE_COMPLETE] Document ${documentId} processed successfully. Record ID: ${recordId}. Priority: ${docScore.reviewPriorityScore}`);
    return { success: true, recordId, documentId };
  } catch (error) {
    console.error(`[PIPELINE_FAILED] Document ${documentId}:`, error);
    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', errorMessage: error.message },
      });
    } catch (dbErr) {
      console.error('[DB_UPDATE_ERROR_DURING_FAILURE]', dbErr.message);
    }
    throw error;
  }
};

// Start BullMQ Worker when run directly
let worker = null;
try {
  worker = new Worker(
    'document-processing',
    async (job) => {
      return await processDocumentPipeline(job.data);
    },
    { connection: redisConnection, concurrency: 3 }
  );

  worker.on('completed', (job) => {
    console.log(`[WORKER] Job ${job.id} completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WORKER] Job ${job.id} failed:`, err.message);
  });
} catch (err) {
  console.warn('[BULLMQ_WORKER_INIT_WARNING] Redis worker could not be connected:', err.message);
}

export default worker;
