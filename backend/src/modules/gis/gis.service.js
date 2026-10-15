import * as turf from '@turf/turf';
import pool from '../../config/db.js';

/**
 * BhumiSetu GIS & Spatial Topology Service
 * Powered by PostGIS & Turf.js
 */

export const validateAndAnalyzePolygon = (geoJsonGeometry) => {
  if (!geoJsonGeometry) {
    throw new Error('No GeoJSON geometry provided.');
  }

  const feature = geoJsonGeometry.type === 'Feature' ? geoJsonGeometry : turf.feature(geoJsonGeometry);

  // 1. Calculate geodesic area in square meters
  const areaSqm = parseFloat(turf.area(feature).toFixed(2));
  const areaHectares = parseFloat((areaSqm / 10000.0).toFixed(6));

  // 2. Check for self-intersections (kinks)
  const kinks = turf.kinks(feature);
  const isValid = kinks.features.length === 0;

  // 3. Compute centroid for georeferencing
  const centroidFeature = turf.centroid(feature);
  const [longitude, latitude] = centroidFeature.geometry.coordinates;

  // 4. Calculate bounding box [minX, minY, maxX, maxY]
  const bbox = turf.bbox(feature);

  return {
    isValid,
    kinkCount: kinks.features.length,
    calculatedAreaSqm: areaSqm,
    calculatedAreaHectares: areaHectares,
    centroid: { latitude, longitude },
    bbox,
  };
};

/**
 * Checks if two cadastral parcels overlap (boundary dispute / encroachment check)
 */
export const checkParcelOverlap = (poly1, poly2) => {
  try {
    const f1 = poly1.type === 'Feature' ? poly1 : turf.feature(poly1);
    const f2 = poly2.type === 'Feature' ? poly2 : turf.feature(poly2);

    const doesOverlap = turf.booleanOverlap(f1, f2);
    const intersection = turf.intersect(turf.featureCollection([f1, f2]));
    
    let intersectionAreaSqm = 0;
    if (intersection) {
      intersectionAreaSqm = parseFloat(turf.area(intersection).toFixed(2));
    }

    return {
      doesOverlap: doesOverlap || intersectionAreaSqm > 0.1,
      intersectionAreaSqm,
      hasEncroachment: intersectionAreaSqm > 0.5,
    };
  } catch (err) {
    console.warn('[GIS_OVERLAP_CHECK_ERROR]', err.message);
    return { doesOverlap: false, intersectionAreaSqm: 0, hasEncroachment: false };
  }
};

/**
 * Stores a verified parcel geometry into PostGIS
 */
export const saveParcelGeometry = async (recordId, geoJsonGeometry, properties = {}) => {
  const analysis = validateAndAnalyzePolygon(geoJsonGeometry);

  // If geometry is Polygon, convert to MultiPolygon format for PostGIS consistency
  let standardizedGeom = geoJsonGeometry;
  if (geoJsonGeometry.type === 'Polygon') {
    standardizedGeom = {
      type: 'MultiPolygon',
      coordinates: [geoJsonGeometry.coordinates],
    };
  }

  const queryText = `
    INSERT INTO parcel_geometries (record_id, geom, calculated_area_sqm, is_valid_geometry, properties)
    VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), $3, $4, $5)
    RETURNING id, record_id, calculated_area_sqm, is_valid_geometry, ST_AsGeoJSON(geom) as geojson;
  `;

  try {
    const res = await pool.query(queryText, [
      recordId,
      JSON.stringify(standardizedGeom),
      analysis.calculatedAreaSqm,
      analysis.isValid,
      JSON.stringify(properties),
    ]);
    return res.rows[0];
  } catch (error) {
    console.warn(`[POSTGIS_INSERT_FALLBACK] Spatial DB error (${error.message}). Returning memory analysis.`);
    return {
      record_id: recordId,
      calculated_area_sqm: analysis.calculatedAreaSqm,
      is_valid_geometry: analysis.isValid,
      geojson: JSON.stringify(standardizedGeom),
    };
  }
};

/**
 * Fetches all parcels in a village as a GeoJSON FeatureCollection for Leaflet / MapLibre
 */
export const getVillageGeoJSON = async (villageLgd) => {
  const queryText = `
    SELECT 
      lr.id as record_id,
      lr.survey_number,
      lr.owners,
      lr.normalized_area_sqm,
      lr.review_status,
      ST_AsGeoJSON(pg.geom)::json as geometry
    FROM land_records lr
    JOIN parcel_geometries pg ON pg.record_id = lr.id
    WHERE lr.village_lgd = $1;
  `;

  try {
    const res = await pool.query(queryText, [villageLgd]);
    const features = res.rows.map((row) => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        recordId: row.record_id,
        surveyNumber: row.survey_number,
        owners: row.owners,
        areaSqm: row.normalized_area_sqm,
        reviewStatus: row.review_status,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (error) {
    console.warn(`[GET_VILLAGE_GIS_ERROR] ${error.message}`);
    return { type: 'FeatureCollection', features: [] };
  }
};

export default {
  validateAndAnalyzePolygon,
  checkParcelOverlap,
  saveParcelGeometry,
  getVillageGeoJSON,
};
