/**
 * BhumiSetu Client-Side Edge Preprocessing & Direct S3 Upload Utility
 * Designed for Web Browser UI to eliminate server CPU/RAM bottlenecks
 */

/**
 * 1. Computes SHA-256 hash in client browser using Web Crypto API
 * @param {Blob | File} file
 * @returns {Promise<string>} hex string
 */
export async function computeClientSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 2. Downscales oversized scans to optimal 300 DPI (max 2400px) and converts to grayscale
 * @param {File | Blob} file
 * @param {object} options
 * @returns {Promise<{ optimizedBlob: Blob, originalSizeBytes: number, optimizedSizeBytes: number, compressionRatioPercent: number }>}
 */
export async function downscaleAndOptimizeScan(file, options = {}) {
  const { maxDimension = 2400, quality = 0.88, toGrayscale = true, targetMimeType = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve({
        optimizedBlob: file,
        originalSizeBytes: file.size,
        optimizedSizeBytes: file.size,
        compressionRatioPercent: 0,
      });
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, width, height);

      if (toGrayscale) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas optimization failed'));
          resolve({
            optimizedBlob: blob,
            originalSizeBytes: file.size,
            optimizedSizeBytes: blob.size,
            compressionRatioPercent: parseFloat(((1 - blob.size / file.size) * 100).toFixed(1)),
            width,
            height,
          });
        },
        targetMimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for client-side optimization'));
    };

    img.src = url;
  });
}

/**
 * 3. Complete Zero-Server-CPU Direct Upload Pipeline
 */
export async function uploadDocumentDirectToS3({
  file,
  apiBaseUrl = 'http://localhost:5000/api/v1',
  authToken,
  stateLgd = '29', // Default Karnataka (29) or UP (09)
  districtLgd = '557',
  onProgress = () => {},
}) {
  onProgress({ stage: 'OPTIMIZING_IMAGE', percent: 15, message: 'Optimizing scan resolution & luma contrast...' });
  const optimization = await downscaleAndOptimizeScan(file);
  const uploadBlob = optimization.optimizedBlob;

  onProgress({ stage: 'COMPUTING_HASH', percent: 35, message: 'Calculating cryptographic SHA-256 client signature...' });
  const sha256Hash = await computeClientSHA256(uploadBlob);

  onProgress({ stage: 'REQUESTING_PRESIGNED_SLOT', percent: 50, message: 'Verifying deduplication and reserving S3 slot...' });
  const slotRes = await fetch(`${apiBaseUrl}/documents/request-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      originalFilename: file.name,
      mimeType: uploadBlob.type || 'image/jpeg',
      fileSizeBytes: uploadBlob.size,
      sha256Hash,
      stateLgd,
      districtLgd,
    }),
  });

  const slotData = await slotRes.json();
  if (!slotData.success) {
    throw new Error(slotData.error || 'Failed to request upload slot');
  }

  if (slotData.isDuplicate) {
    onProgress({ stage: 'DUPLICATE_FOUND', percent: 100, message: 'Duplicate document found in registry.' });
    return { isDuplicate: true, document: slotData.document, sha256Hash };
  }

  // Direct Binary S3 PUT
  onProgress({ stage: 'UPLOADING_DIRECT_TO_S3', percent: 75, message: 'Streaming binary scan directly to MinIO/S3 bucket...' });
  const s3UploadRes = await fetch(slotData.presignedUploadUrl, {
    method: 'PUT',
    headers: slotData.uploadHeaders || { 'Content-Type': uploadBlob.type },
    body: uploadBlob,
  });

  if (!s3UploadRes.ok) {
    throw new Error(`Direct S3 upload failed with status ${s3UploadRes.status}`);
  }

  // Finalize Webhook
  onProgress({ stage: 'ENQUEUING_PIPELINE', percent: 90, message: 'Acknowledging upload and dispatching BullMQ worker...' });
  const completeRes = await fetch(`${apiBaseUrl}/documents/${slotData.document.id}/complete-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const completeData = await completeRes.json();
  onProgress({ stage: 'DONE', percent: 100, message: 'Document ingested and queued for AI verification.' });

  return {
    isDuplicate: false,
    documentId: slotData.document.id,
    sha256Hash,
    queueStatus: completeData.queueStatus,
    optimizationStats: {
      originalSizeBytes: optimization.originalSizeBytes,
      optimizedSizeBytes: optimization.optimizedSizeBytes,
      compressionRatioPercent: optimization.compressionRatioPercent,
    },
  };
}

export default {
  computeClientSHA256,
  downscaleAndOptimizeScan,
  uploadDocumentDirectToS3,
};
