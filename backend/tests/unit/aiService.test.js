import { extractLandRecord } from '../../src/services/ai/ai.service.js';
import { sanitizeAndParseGeminiResponse, normalizeVisionOutput } from '../../src/services/ai/gemini.client.js';

describe('AI Dual-Mode Extraction Service', () => {
  const dummyBuffer = Buffer.from('fake_image_bytes_for_testing');

  describe('Vision LLM Response Sanitizer & Parser', () => {
    it('should parse clean JSON directly', () => {
      const raw = '{"detectedLanguage": "Hindi", "surveyNumber": "143/3", "rawArea": 1.459}';
      const parsed = sanitizeAndParseGeminiResponse(raw);
      expect(parsed.detectedLanguage).toBe('Hindi');
      expect(parsed.surveyNumber).toBe('143/3');
    });

    it('should strip markdown code fences (```json ... ```)', () => {
      const wrapped = '```json\n{"detectedLanguage": "Kannada", "surveyNumber": "84/2A"}\n```';
      const parsed = sanitizeAndParseGeminiResponse(wrapped);
      expect(parsed.detectedLanguage).toBe('Kannada');
      expect(parsed.surveyNumber).toBe('84/2A');
    });

    it('should throw clear error on unparseable garbage', () => {
      expect(() => sanitizeAndParseGeminiResponse('not json at all')).toThrow('Invalid JSON returned from Vision LLM');
    });
  });

  describe('Vision Output Normalizer', () => {
    it('should normalize Hindi Khasra response into canonical schema', () => {
      const normalized = normalizeVisionOutput({
        detectedLanguage: 'Hindi',
        documentType: 'Khasra',
        surveyNumber: '143/3',
        subdivisionNumber: '3',
        rawArea: 1.459,
        rawUnit: 'Hectare',
        villageName: 'रामपुर',
        owners: [{ name: 'उमाकांत प्रसाद', sharePercent: 100 }],
      });

      expect(normalized.detectedLanguage).toBe('Hindi');
      expect(normalized.surveyNumber).toBe('143/3');
      expect(normalized.rawArea).toBe(1.459);
      expect(normalized.rawUnit).toBe('Hectare');
      expect(normalized.owners[0].name).toBe('उमाकांत प्रसाद');
      expect(normalized.fields.length).toBeGreaterThanOrEqual(4);
    });

    it('should normalize Kannada RTC response into canonical schema', () => {
      const normalized = normalizeVisionOutput({
        detectedLanguage: 'Kannada',
        documentType: 'RTC Form 16 (Pahani)',
        surveyNumber: '84/2A',
        rawArea: 2.35,
        rawUnit: 'Acre',
        villageName: 'ಕೆಂಪಾಪುರ',
        owners: [{ name: 'ಬಸವರಾಜ್ ಗೌಡ', sharePercent: 100 }],
      });

      expect(normalized.detectedLanguage).toBe('Kannada');
      expect(normalized.surveyNumber).toBe('84/2A');
      expect(normalized.owners[0].name).toBe('ಬಸವರಾಜ್ ಗೌಡ');
    });
  });

  describe('Dual Mode Execution Router', () => {
    it('should execute in LLM mode by default and detect Hindi land record', async () => {
      const result = await extractLandRecord(dummyBuffer, 'hindi_khasra.jpg');
      expect(result).toBeDefined();
      expect(result.extractedData).toBeDefined();
      expect(result.extractedData.surveyNumber).toBe('143/3');
      expect(result.extractedData.detectedLanguage).toBe('Hindi');
      expect(result.engineUsed).toBeDefined();
    });

    it('should detect Kannada land record and return Kannada schema', async () => {
      const result = await extractLandRecord(dummyBuffer, 'karnataka_bhoomi_rtc.jpg');
      expect(result).toBeDefined();
      expect(result.extractedData.surveyNumber).toBe('84/2A');
      expect(result.extractedData.detectedLanguage).toBe('Kannada');
      expect(result.extractedData.stateLgd).toBe('29'); // Karnataka
    });
  });
});
