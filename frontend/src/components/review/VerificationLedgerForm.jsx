import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Copy, Check, CheckCircle2, ShieldCheck } from 'lucide-react';

export const VerificationLedgerForm = ({ record, remarks, setRemarks }) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const [ownerName, setOwnerName] = useState(record?.partyDetails || record?.rtcExtract?.occupantName || 'Ramakrishnaiah S/o Venkatappa');
  const [surveyNo, setSurveyNo] = useState(record?.surveyNumber || '142/3A');
  const [areaCustomary, setAreaCustomary] = useState(record?.areaText || '2 Ac 14 Gt');
  const [areaHectares, setAreaHectares] = useState(record?.extentEngine?.hectares?.toString() || '0.9511');

  useEffect(() => {
    if (record) {
      setOwnerName(record.partyDetails || record.rtcExtract?.occupantName || '');
      setSurveyNo(record.surveyNumber || '');
      setAreaCustomary(record.areaText || record.extentEngine?.customary || '');
      setAreaHectares(record.extentEngine?.hectares?.toString() || '0.9511');
    }
  }, [record]);

  const ulpin = record?.ulpin || 'KA-29-08-014-00142-003A';

  const handleCopyUlpin = () => {
    navigator.clipboard.writeText(ulpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="verification-card">
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {language === 'en' ? 'Extracted Field Verification' : 'ದಾಖಲೆ ವಿವರಗಳ ಪರಿಶೀಲನೆ'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {language === 'en' ? 'Compare extracted fields against deed scan on left' : 'ಎಡಭಾಗದ ಪಹಣಿ/ಕ್ರಯಪತ್ರದೊಂದಿಗೆ ಕ್ಷೇತ್ರಗಳನ್ನು ತಾಳೆ ನೋಡಿ'}
          </div>
        </div>
      </div>

      {/* 1. Owner Legal Name Field with OCR Confidence */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {language === 'en' ? 'Landholder Name' : 'ಖಾತೆದಾರರ ಹೆಸರು'}
          </span>
          <span className="gov-status-pill status-pill-verified" style={{ fontSize: '10px' }}>
            OCR: 99.2%
          </span>
        </div>
        <input
          type="text"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '13px',
            fontWeight: 700,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
        />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Kannada Script: ರಾಮಕೃಷ್ಣಯ್ಯ ಬಿನ್ ವೆಂಕಟಪ್ಪ • Aadhaar: UIDAI ********9281
        </div>
      </div>

      {/* 2. Survey & Hissa / Land Class */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Survey & Hissa No.
            </span>
            <span className="gov-status-pill status-pill-verified" style={{ fontSize: '10px' }}>
              OCR: 100%
            </span>
          </div>
          <input
            type="text"
            value={surveyNo}
            onChange={(e) => setSurveyNo(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '13px',
              fontWeight: 700,
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Land Classification
            </span>
            <span className="gov-status-pill status-pill-verified" style={{ fontSize: '10px' }}>
              OCR: 98.4%
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, padding: '6px 0', color: 'var(--text-primary)' }}>
            Dry Agricultural (ಖುಷ್ಕಿ)
          </div>
        </div>
      </div>

      {/* 3. ULPIN Standard */}
      <div className="ulpin-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            ULPIN (Bhu-Aadhaar)
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Provisional 14-digit ID</span>
        </div>

        <div className="ulpin-pill">
          <span>{ulpin}</span>
          <button onClick={handleCopyUlpin} title="Copy ULPIN" style={{ display: 'flex', alignItems: 'center' }}>
            {copied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* 4. Extent Engine */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Land Extent Conversion
          </span>
          <span className="gov-status-pill status-pill-verified" style={{ fontSize: '10px' }}>
            OCR: 97.6%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Customary (Acres-Guntas)
            </label>
            <input
              type="text"
              value={areaCustomary}
              onChange={(e) => setAreaCustomary(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Standard (Hectares)
            </label>
            <input
              type="text"
              value={areaHectares}
              onChange={(e) => setAreaHectares(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. Officer Notes & Remarks */}
      <div>
        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
          {language === 'en' ? 'Officer Verification Remarks' : 'ಅಧಿಕಾರಿ ಪರಿಶೀಲನಾ ಟಿಪ್ಪಣಿ'}
        </label>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={language === 'en' ? 'Enter statutory notes or grounds for adjudication...' : 'ಕಾನೂನುಬದ್ಧ ಟಿಪ್ಪಣಿಗಳನ್ನು ನಮೂದಿಸಿ...'}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: '12px',
            lineHeight: 1.4,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
  );
};

export default VerificationLedgerForm;
