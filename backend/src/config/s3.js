import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { config } from './env.js';

export const s3Client = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

const localUploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadDir)) {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

export const uploadBuffer = async (key, buffer, mimeType = 'application/octet-stream') => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);
    return { storageType: 's3', key, url: `${config.s3.endpoint}/${config.s3.bucket}/${key}` };
  } catch (error) {
    console.warn(`[S3_STORAGE_FALLBACK] S3 unreachable (${error.message}). Saving to local directory.`);
    const localFilePath = path.join(localUploadDir, path.basename(key));
    fs.writeFileSync(localFilePath, buffer);
    return { storageType: 'local', key, localPath: localFilePath };
  }
};

export const getObjectBuffer = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });
    const response = await s3Client.send(command);
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (error) {
    const localFilePath = path.join(localUploadDir, path.basename(key));
    if (fs.existsSync(localFilePath)) {
      return fs.readFileSync(localFilePath);
    }
    throw new Error(`File not found in S3 or local storage: ${key}`);
  }
};

export const getPresignedDownloadUrl = async (key, expiresInSeconds = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    return `/api/v1/documents/raw/${encodeURIComponent(key)}`;
  }
};

export const getPresignedUploadUrl = async (key, mimeType = 'image/jpeg', expiresInSeconds = 900) => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      ContentType: mimeType,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.warn(`[PRESIGNED_UPLOAD_FALLBACK] Error generating presigned URL: ${error.message}`);
    return null;
  }
};

export default s3Client;


