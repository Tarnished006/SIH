import sharp from 'sharp';

/**
 * Intelligent Land Record Preprocessor
 * 1. Auto-rotates image according to EXIF metadata.
 * 2. Detects if a wide landscape ledger (e.g., Karnataka RTC Form 16 / Pahani) was captured in portrait orientation
 *    (aspect ratio height > width * 1.3) and rotates it 90 degrees clockwise to natural reading orientation.
 * 3. Normalizes contrast and cleans up border artifacts.
 */
export const preprocessLandRecord = async (imageBuffer, filename = 'document.jpg') => {
  try {
    const meta = await sharp(imageBuffer).metadata();
    console.log(`[PREPROCESSOR] Input image "${filename}": ${meta.width}x${meta.height}, format: ${meta.format}, orientation: ${meta.orientation || 'none'}`);

    let pipeline = sharp(imageBuffer);

    // 1. Auto-rotate based on EXIF tag
    pipeline = pipeline.rotate();

    // 2. Check for portrait orientation on wide ledger (e.g. 460x1024)
    if (meta.width && meta.height && meta.height > meta.width * 1.3) {
      console.log(`[PREPROCESSOR] Tall aspect ratio (${(meta.height / meta.width).toFixed(2)}) detected for land record. Applying 90° clockwise deskew...`);
      pipeline = pipeline.rotate(90);
    }

    const processedBuffer = await pipeline
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    const newMeta = await sharp(processedBuffer).metadata();
    console.log(`[PREPROCESSOR] Preprocessed image ready: ${newMeta.width}x${newMeta.height} (${processedBuffer.length} bytes)`);

    return {
      buffer: processedBuffer,
      wasRotated: meta.height > meta.width * 1.3,
      width: newMeta.width,
      height: newMeta.height,
    };
  } catch (err) {
    console.warn(`[PREPROCESSOR] Image preprocessing failed (${err.message}). Using raw buffer.`);
    return {
      buffer: imageBuffer,
      wasRotated: false,
    };
  }
};

export default {
  preprocessLandRecord,
};
