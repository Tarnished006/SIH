/**
 * Deterministic Mock for Hugging Face Inference Endpoints
 * Emits realistic structured OCR extraction results for Indian Land Records (Jamabandi / RoR)
 */

export const generateMockHFExtraction = (filename = 'scanned_record.jpg') => {
  return {
    model: 'bhumisetu-trocr-indic-finetuned',
    modelVersion: 'v1.4.2',
    inferenceTimeMs: 420,
    extractedData: {
      stateLgd: '09', // Uttar Pradesh
      stateName: 'UTTAR PRADESH',
      districtLgd: '140', // Lucknow
      districtName: 'LUCKNOW',
      subdistrictLgd: '00753', // Sadar
      villageLgd: '123456',
      villageName: 'Mohanlalganj',
      surveyNumber: '142/2',
      subdivisionNumber: '1',
      landClassification: 'Agricultural (Krishi)',
      rawArea: 4.5,
      rawUnit: 'Bigha',
      owners: [
        {
          name: 'Ram Charan Verma',
          relation: 'S/O Shiv Dayal',
          sharePercent: 60.0,
          aadhaarRef: 'XXXX-XXXX-9821',
        },
        {
          name: 'Suresh Kumar Verma',
          relation: 'S/O Shiv Dayal',
          sharePercent: 40.0,
          aadhaarRef: 'XXXX-XXXX-3412',
        },
      ],
      fields: [
        {
          fieldName: 'state',
          value: 'UTTAR PRADESH',
          confidence: 0.98,
          boundingBox: [45, 120, 75, 400],
        },
        {
          fieldName: 'district',
          value: 'LUCKNOW',
          confidence: 0.96,
          boundingBox: [85, 120, 115, 380],
        },
        {
          fieldName: 'village',
          value: 'Mohanlalganj',
          confidence: 0.94,
          boundingBox: [130, 120, 160, 420],
        },
        {
          fieldName: 'survey_number',
          value: '142/2',
          confidence: 0.91,
          boundingBox: [210, 150, 240, 280],
        },
        {
          fieldName: 'area',
          value: '4.5 Bigha',
          confidence: 0.89,
          boundingBox: [260, 150, 290, 310],
        },
        {
          fieldName: 'landowner_1',
          value: 'Ram Charan Verma',
          confidence: 0.88,
          boundingBox: [320, 100, 350, 450],
        },
        {
          fieldName: 'landowner_2',
          value: 'Suresh Kumar Verma',
          confidence: 0.86,
          boundingBox: [365, 100, 395, 460],
        },
      ],
      // Approximate centroid for spatial georeferencing
      centroid: {
        latitude: 26.6854,
        longitude: 80.9842,
      },
    },
  };
};

export default {
  generateMockHFExtraction,
};
