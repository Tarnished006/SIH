/**
 * BhumiSetu Client-Side Edge Preprocessing & Direct S3 Upload Utility
 * Designed for React / Web UI to eliminate server CPU/RAM bottlenecks
 */

/**
 * 1. Computes SHA-256 hash in the client browser using Web Crypto API
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
 * 2. Downscales oversized 600+ DPI scans to optimal 300 DPI (max 2400px)
 *    and converts to 8-bit grayscale WebP/JPEG.
 *    Reduces 40MB TIFF/PNG to ~1.5MB without losing OCR text sharpness.
 * @param {File | Blob} file
 * @param {object} options
 * @returns {Promise<{ optimizedBlob: Blob, originalSizeBytes: number, optimizedSizeBytes: number }>}
 */
export async function downscaleAndOptimizeScan(file, options = {}) {
  const { maxDimension = 2400, quality = 0.85, toGrayscale = true, targetMimeType = 'image/webp' } = options;

  return new Promise((resolve, reject) => {
    // If not running in browser DOM environment, return original
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve({
        optimizedBlob: file,
        originalSizeBytes: file.size,
        optimizedSizeBytes: file.size,
      });
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Calculate scale factor to bound max dimension
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

      // Optional: Grayscale conversion to strip yellowed paper color
      if (toGrayscale) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Standard ITU-R BT.601 luma weights
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
 *    (Client -> S3 Direct -> Backend Webhook)
 */
export async function uploadDocumentDirectToS3({
  file,
  apiBaseUrl = '/api/v1',
  authToken,
  stateLgd = '09',
  districtLgd = '140',
  onProgress = () => {},
}) {
  onProgress({ stage: 'OPTIMIZING_IMAGE', percent: 10 });
  const optimization = await downscaleAndOptimizeScan(file);
  const uploadBlob = optimization.optimizedBlob;

  onProgress({ stage: 'COMPUTING_HASH', percent: 30 });
  const sha256Hash = await computeClientSHA256(uploadBlob);

  onProgress({ stage: 'REQUESTING_PRESIGNED_SLOT', percent: 45 });
  const slotRes = await fetch(`${apiBaseUrl}/documents/request-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      originalFilename: file.name,
      mimeType: uploadBlob.type || 'image/webp',
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

  // If duplicate, server skipped upload entirely
  if (slotData.isDuplicate) {
    onProgress({ stage: 'DUPLICATE_FOUND', percent: 100 });
    return { isDuplicate: true, document: slotData.document };
  }

  // Direct Binary Upload to S3 / MinIO (bypassing Node.js server)
  onProgress({ stage: 'UPLOADING_DIRECT_TO_S3', percent: 70 });
  const s3UploadRes = await fetch(slotData.presignedUploadUrl, {
    method: 'PUT',
    headers: slotData.uploadHeaders || { 'Content-Type': uploadBlob.type },
    body: uploadBlob,
  });

  if (!s3UploadRes.ok) {
    throw new Error(`Direct S3 upload failed with status ${s3UploadRes.status}`);
  }

  // Notify backend to enqueue BullMQ worker
  onProgress({ stage: 'ENQUEUING_PIPELINE', percent: 90 });
  const completeRes = await fetch(`${apiBaseUrl}/documents/${slotData.document.id}/complete-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const completeData = await completeRes.json();
  onProgress({ stage: 'DONE', percent: 100 });

  return {
    isDuplicate: false,
    documentId: slotData.document.id,
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
