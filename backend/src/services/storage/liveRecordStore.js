import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always resolve to backend/uploads regardless of where node was started
const uploadsDir = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storeFilePath = path.join(uploadsDir, 'records_store.json');

// Also check root uploads folder if exists
const rootUploadsDir = path.resolve(__dirname, '../../../../uploads');
const rootStoreFilePath = path.join(rootUploadsDir, 'records_store.json');

export const loadStore = () => {
  try {
    let raw = null;
    if (fs.existsSync(storeFilePath)) {
      raw = fs.readFileSync(storeFilePath, 'utf8');
    } else if (fs.existsSync(rootStoreFilePath)) {
      raw = fs.readFileSync(rootStoreFilePath, 'utf8');
    }

    if (raw) {
      const data = JSON.parse(raw);
      return {
        documents: new Map(Object.entries(data.documents || {})),
        records: new Map(Object.entries(data.records || {})),
      };
    }
  } catch (e) {
    console.warn('[STORE] Could not read disk store:', e.message);
  }
  return { documents: new Map(), records: new Map() };
};

export const saveStore = (documentsMap, recordsMap) => {
  try {
    const data = {
      documents: Object.fromEntries(documentsMap.entries()),
      records: Object.fromEntries(recordsMap.entries()),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(storeFilePath, jsonStr, 'utf8');
    if (fs.existsSync(rootUploadsDir)) {
      fs.writeFileSync(rootStoreFilePath, jsonStr, 'utf8');
    }
  } catch (e) {
    console.warn('[STORE] Could not save to disk store:', e.message);
  }
};

export const saveDocumentLocally = ({ id, originalFilename, mimeType, buffer, uploadedBy }) => {
  const ext = originalFilename.split('.').pop() || 'jpg';
  const filePath = path.join(uploadsDir, `${id}.${ext}`);
  fs.writeFileSync(filePath, buffer);

  const doc = {
    id,
    originalFilename,
    mimeType,
    filePath,
    s3Key: `local/${id}.${ext}`,
    uploadedById: uploadedBy || null,
    status: 'PROCESSED',
    createdAt: new Date().toISOString(),
  };

  const current = loadStore();
  current.documents.set(id, doc);
  saveStore(current.documents, current.records);
  return doc;
};

export const getDocumentLocally = (id) => {
  const current = loadStore();
  return current.documents.get(id) || null;
};

export const getDocumentBufferLocally = (id) => {
  const current = loadStore();
  const doc = current.documents.get(id);
  if (doc && fs.existsSync(doc.filePath)) {
    return { buffer: fs.readFileSync(doc.filePath), mimeType: doc.mimeType, originalFilename: doc.originalFilename };
  }

  // Check both uploadsDir and rootUploadsDir
  const searchDirs = [uploadsDir, rootUploadsDir].filter(d => fs.existsSync(d));
  for (const d of searchDirs) {
    const files = fs.readdirSync(d);
    const matched = files.find((f) => f.startsWith(id));
    if (matched) {
      const fullPath = path.join(d, matched);
      return { buffer: fs.readFileSync(fullPath), mimeType: 'image/jpeg', originalFilename: matched };
    }
  }
  return null;
};

export const saveLiveRecord = (record) => {
  const current = loadStore();
  current.records.set(record.id, record);
  saveStore(current.documents, current.records);
  return record;
};

export const getLiveRecord = (id) => {
  const current = loadStore();
  return current.records.get(id) || null;
};

export const getAllLiveRecords = () => {
  const current = loadStore();
  return Array.from(current.records.values()).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
};

export const updateLiveRecord = (id, updates) => {
  const current = loadStore();
  const existing = current.records.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  current.records.set(id, updated);
  saveStore(current.documents, current.records);
  return updated;
};

export default {
  saveDocumentLocally,
  getDocumentLocally,
  getDocumentBufferLocally,
  saveLiveRecord,
  getLiveRecord,
  getAllLiveRecords,
  updateLiveRecord,
};
