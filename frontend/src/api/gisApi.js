import apiClient from './client';

export const analyzePolygon = async (geometry) => {
  const res = await apiClient.post('/gis/analyze-polygon', { geometry });
  return res.data;
};

export const checkOverlap = async (poly1, poly2) => {
  const res = await apiClient.post('/gis/check-overlap', { poly1, poly2 });
  return res.data;
};

export const saveParcelGeometry = async (recordId, geometry, properties = {}) => {
  const res = await apiClient.post(`/gis/parcel/${recordId}`, { geometry, properties });
  return res.data;
};

export const getVillageGeoJSON = async (villageLgd) => {
  const res = await apiClient.get(`/gis/village/${villageLgd}`);
  return res.data;
};

export default {
  analyzePolygon,
  checkOverlap,
  saveParcelGeometry,
  getVillageGeoJSON,
};
