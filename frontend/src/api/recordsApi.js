import apiClient from './client';

export const findRecords = async (params = {}) => {
  const res = await apiClient.get('/records', { params });
  return res.data;
};

export const getRecord = async (id) => {
  const res = await apiClient.get(`/records/${id}`);
  return res.data;
};

export default {
  findRecords,
  getRecord,
};
