import multer from 'multer';

// Use memory storage for direct streaming to S3 and sharp
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
  'application/pdf',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Unsupported file type: ${file.mimetype}. Allowed formats: JPEG, PNG, TIFF, WEBP, PDF`),
      false
    );
  }
};

export const uploadSingleDocument = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB maximum for high-resolution cadastral scans
  },
  fileFilter,
}).single('document');

export default uploadSingleDocument;
