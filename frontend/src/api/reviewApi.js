import apiClient from './client';

export const fetchQueue = async (params = {}) => {
  const res = await apiClient.get('/review/queue', { params });
  return res.data;
};

export const lockRecord = async (recordId) => {
  const res = await apiClient.post(`/review/${recordId}/lock`);
  return res.data;
};

export const unlockRecord = async (recordId) => {
  const res = await apiClient.post(`/review/${recordId}/unlock`);
  return res.data;
};

export const submitReviewDecision = async (recordId, payload) => {
  const res = await apiClient.post(`/review/${recordId}/submit`, payload);
  return res.data;
};

export default {
  fetchQueue,
  lockRecord,
  unlockRecord,
  submitReviewDecision,
};
