import {
  validateAndAnalyzePolygon,
  checkParcelOverlap,
  saveParcelGeometry,
  getVillageGeoJSON,
} from './gis.service.js';

export const analyzePolygon = async (req, res, next) => {
  try {
    const { geometry } = req.body;
    if (!geometry) {
      return res.status(400).json({ success: false, error: 'Geometry object is required' });
    }
    const analysis = validateAndAnalyzePolygon(geometry);
    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

export const verifyOverlap = async (req, res, next) => {
  try {
    const { poly1, poly2 } = req.body;
    if (!poly1 || !poly2) {
      return res.status(400).json({ success: false, error: 'poly1 and poly2 GeoJSON features are required' });
    }
    const overlapResult = checkParcelOverlap(poly1, poly2);
    res.json({ success: true, ...overlapResult });
  } catch (error) {
    next(error);
  }
};

export const attachParcelGeometry = async (req, res, next) => {
  try {
    const { geometry, properties } = req.body;
    const { recordId } = req.params;
    const result = await saveParcelGeometry(recordId, geometry, properties);
    res.json({ success: true, parcel: result });
  } catch (error) {
    next(error);
  }
};

export const getVillageMapData = async (req, res, next) => {
  try {
    const { villageLgd } = req.params;
    const geojson = await getVillageGeoJSON(villageLgd);
    res.json({ success: true, ...geojson });
  } catch (error) {
    next(error);
  }
};

export default {
  analyzePolygon,
  verifyOverlap,
  attachParcelGeometry,
  getVillageMapData,
};
