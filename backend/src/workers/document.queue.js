import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { processDocumentPipeline } from './document.worker.js';

let documentQueue = null;

try {
  documentQueue = new Queue('document-processing', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
} catch (err) {
  console.warn('[BULLMQ_QUEUE_WARNING] Redis queue initialization failed. Direct execution mode will be active:', err.message);
}

/**
 * Enqueues a document processing job or runs synchronously if Redis is offline
 */
export const enqueueDocumentProcessing = async (jobData) => {
  if (documentQueue) {
    try {
      const job = await documentQueue.add('process-scan', jobData);
      console.log(`[QUEUE] Enqueued document processing job ${job.id} for doc ${jobData.documentId}`);
      return { mode: 'async_queued', jobId: job.id };
    } catch (err) {
      console.warn(`[QUEUE_ENQUEUE_FALLBACK] Failed to enqueue to Redis (${err.message}). Executing in-process.`);
    }
  }

  // Graceful fallback: run asynchronously in-process
  setImmediate(async () => {
    try {
      await processDocumentPipeline(jobData);
    } catch (workerErr) {
      console.error('[DIRECT_PIPELINE_ERROR]', workerErr);
    }
  });

  return { mode: 'in_process_fallback', jobId: `in-proc-${Date.now()}` };
};

export default {
  documentQueue,
  enqueueDocumentProcessing,
};
