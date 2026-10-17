import apiClient from './client';

export const getRecordAuditHistory = async (recordId) => {
  const res = await apiClient.get(`/audit/record/${recordId}`);
  return res.data;
};

export const verifyLedgerChain = async () => {
  const res = await apiClient.get('/audit/verify-chain');
  return res.data;
};

export default {
  getRecordAuditHistory,
  verifyLedgerChain,
};
