import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ZoomIn, ZoomOut, Contrast, Move, CheckCircle2 } from 'lucide-react';

export const RTCArchiveViewer = ({ record }) => {
  const { t } = useLanguage();
  const [viewTab, setViewTab] = useState('archive'); // 'archive' | 'extracted'
  const [zoomLevel, setZoomLevel] = useState(180);
  const [contrastInvert, setContrastInvert] = useState(false);

  const rtc = record.rtcExtract || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* View Mode Toggle Bar (Archive vs Extracted) */}
      <div className="view-mode-tabs">
        <button
          className={`view-mode-tab ${viewTab === 'archive' ? 'active' : ''}`}
          onClick={() => setViewTab('archive')}
        >
          <span>{t('archiveOriginal')}</span>
        </button>
        <button
          className={`view-mode-tab ${viewTab === 'extracted' ? 'active' : ''}`}
          onClick={() => setViewTab('extracted')}
        >
          <span>{t('extractedData')}</span>
        </button>
      </div>

      {/* RTC Document Card (Recreating the parchment extract visual from Screenshot 2) */}
      <div className="rtc-document-sheet" style={{ filter: contrastInvert ? 'invert(1) hue-rotate(180deg)' : 'none' }}>
        {/* Toolbar */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            paddingBottom: '6px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <span>[ ]</span>
            <span>{t('rtcExtract')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setContrastInvert((p) => !p)}
              title="Toggle high contrast invert"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <Contrast size={13} />
            </button>
            <button onClick={() => setZoomLevel((z) => Math.max(100, z - 20))} title="Zoom Out">
              <ZoomOut size={13} />
            </button>
            <span style={{ fontWeight: 700 }}>{zoomLevel}%</span>
            <button onClick={() => setZoomLevel((z) => Math.min(300, z + 20))} title="Zoom In">
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        {/* Heading in Kannada matching Screenshot 2 */}
        <div className="rtc-title">
          ಹಕ್ಕು ದಾಖಲೆ, ಬೆಳೆ ವಿಚಾರಣೆ ಮತ್ತು ಗೇಣಿ ಪುಸ್ತಕ (RTC)
        </div>

        {/* Extracted Form Grid */}
        <div className="rtc-fields-table">
          {/* Khata No */}
          <div className="rtc-cell">
            <span className="rtc-cell-label">{t('khataNo')}</span>
            <span className="rtc-cell-value font-mono">{rtc.khataNo || 'KH-88832'}</span>
          </div>

          {/* Hissa No */}
          <div className="rtc-cell">
            <span className="rtc-cell-label">{t('hissaNo')}</span>
            <span className="rtc-cell-value font-mono">{rtc.hissaNo || record.hissaNumber || '142/3A'}</span>
          </div>

          {/* Occupant / Owner (Full Width) */}
          <div className="rtc-cell full-width">
            <span className="rtc-cell-label">{t('occupantOwner')}</span>
            <span className="rtc-cell-value" style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
              {rtc.occupantNameKn || 'ರಾಮಕೃಷ್ಣಯ್ಯ ಬಿನ್ ವೆಂಕಟಪ್ಪ'}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              {rtc.occupantName || 'Ramakrishnaiah S/o Venkatappa'}
            </span>
          </div>

          {/* Total Extent */}
          <div className="rtc-cell">
            <span className="rtc-cell-label">{t('totalExtent')}</span>
            <span className="rtc-cell-value font-mono">{rtc.rawExtent || '2-14 (ಎಕರೆ-ಗುಂಟೆ)'}</span>
          </div>

          {/* Classification */}
          <div className="rtc-cell">
            <span className="rtc-cell-label">{t('classification')}</span>
            <span className="rtc-cell-value">{rtc.classification || 'ಖುಷ್ಕಿ (Dry Land)'}</span>
          </div>
        </div>

        {/* Pan Hint & OCR Clarity Footer */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
            paddingTop: '6px',
            fontSize: '9.5px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
            <Move size={11} />
            <span>{t('panPinchHint')}</span>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
            ✓ {rtc.archiveDocId || 'KAVERI-ARCHIVE-DOC#98921'} • {rtc.ocrClarity || t('clarityOcr')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RTCArchiveViewer;
