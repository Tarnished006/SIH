import apiClient from './client';

export const requestUploadSlot = async (payload) => {
  const res = await apiClient.post('/documents/request-upload', payload);
  return res.data;
};

export const finalizeUpload = async (documentId) => {
  const res = await apiClient.post(`/documents/${documentId}/complete-upload`);
  return res.data;
};

export const uploadDocumentFallback = async (formData) => {
  const res = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const analyzeDirect = async (formData) => {
  const res = await apiClient.post('/documents/analyze-direct', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const listDocuments = async (params = {}) => {
  const res = await apiClient.get('/documents', { params });
  return res.data;
};

export const getDocument = async (id) => {
  const res = await apiClient.get(`/documents/${id}`);
  return res.data;
};

export default {
  requestUploadSlot,
  finalizeUpload,
  uploadDocumentFallback,
  analyzeDirect,
  listDocuments,
  getDocument,
};
