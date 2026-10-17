import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Copy, 
  Check, 
  FileCheck, 
  Download, 
  ChevronRight, 
  MapPin, 
  Layers, 
  Info,
  ExternalLink
} from 'lucide-react';

export const ParcelDetailDrawer = ({ parcel, onReviewClick = null }) => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!parcel) {
    return (
      <div className="gov-inspector-empty">
        <Info size={20} color="var(--text-muted)" />
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
          {language === 'en' 
            ? 'Select any parcel polygon on the cadastral map to inspect boundary records' 
            : 'ದಾಖಲೆ ವಿವರಗಳಿಗಾಗಿ ನಕ್ಷೆಯಲ್ಲಿ ಸರ್ವೆ ನಂಬರ್ ಆಯ್ಕೆಮಾಡಿ'}
        </div>
      </div>
    );
  }

  const ulpin = parcel.ulpin || 'KA-29-08-014-00142-003A';

  const handleCopy = () => {
    navigator.clipboard.writeText(ulpin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadGeoJSON = () => {
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [parcel.points?.map((p) => [77.34 + p.x * 0.0001, 12.98 + p.y * 0.0001]) || []],
      },
      properties: {
        surveyNumber: parcel.surveyNumber,
        hissa: parcel.hissa,
        areaSqm: parcel.areaSqm,
        owner: parcel.ownerName,
        ulpin,
      },
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhumisetu_cadastral_sy_${parcel.surveyNumber.replace('/', '_')}.geojson`;
    a.click();
  };

  const isReviewAllowed = ['ADMIN', 'TEHSILDAR', 'PATWARI'].includes(role);

  return (
    <div className="gov-parcel-inspector">
      {/* 1. Header with Survey & Status */}
      <div className="gov-inspector-header">
        <div>
          <div className="gov-inspector-sy">
            Sy No. {parcel.surveyNumber}
          </div>
          {parcel.hissa && (
            <div className="gov-inspector-sub">
              {language === 'en' ? `Hissa / Sub-Division: ${parcel.hissa}` : `ಹಿಸ್ಸಾ ಸಂಖ್ಯೆ: ${parcel.hissa}`}
            </div>
          )}
        </div>

        <span className="gov-status-pill gov-status-progress">
          {parcel.status || (language === 'en' ? 'Active Title' : 'ಚಾಲ್ತಿ ಹಕ್ಕು')}
        </span>
      </div>

      {/* 2. ULPIN Geo-Reference Bar */}
      <div className="gov-inspector-ulpin-bar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            ULPIN (Bhu-Aadhaar)
          </span>
          <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600 }}>
            {ulpin}
          </span>
        </div>
        <button 
          onClick={handleCopy} 
          title="Copy ULPIN"
          className="gov-copy-btn"
        >
          {copied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* 3. Essential Parcel Information Table */}
      <table className="gov-inspector-info-table">
        <tbody>
          <tr>
            <td className="gov-info-label">{language === 'en' ? 'Registered Owner' : 'ಖಾತೆದಾರ'}</td>
            <td className="gov-info-value">{parcel.ownerName || 'Ramakrishnaiah S/o Venkatappa'}</td>
          </tr>
          <tr>
            <td className="gov-info-label">{language === 'en' ? 'Total Extent' : 'ವಿಸ್ತೀರ್ಣ'}</td>
            <td className="gov-info-value">{parcel.extent || '2 Ac 14 Gt'} ({parcel.areaSqm?.toLocaleString()} m²)</td>
          </tr>
          <tr>
            <td className="gov-info-label">{language === 'en' ? 'Khata Number' : 'ಖಾತಾ ಸಂಖ್ಯೆ'}</td>
            <td className="gov-info-value">{parcel.khataNo || '412'}</td>
          </tr>
          <tr>
            <td className="gov-info-label">{language === 'en' ? 'Classification' : 'ಭೂಮಿ ವಿಧ'}</td>
            <td className="gov-info-value">{parcel.classification || 'Dry (ಖುಷ್ಕಿ)'}</td>
          </tr>
          <tr>
            <td className="gov-info-label">{language === 'en' ? 'Village / Hobli' : 'ಗ್ರಾಮ / ಹೋಬಳಿ'}</td>
            <td className="gov-info-value">Thippagondanahalli, Kasaba</td>
          </tr>
        </tbody>
      </table>

      {/* 4. Clear Primary Action */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isReviewAllowed && (
          <button
            className="gov-table-action-btn primary"
            style={{ width: '100%', padding: '9px 12px', fontSize: '12px', justifyContent: 'center' }}
            onClick={() => {
              if (onReviewClick) onReviewClick();
              else navigate('/review/rec-142-3a-thippa');
            }}
          >
            <FileCheck size={14} />
            <span>{language === 'en' ? 'Open Review Workspace' : 'ಪರಿಶೀಲನಾ ವರ್ಕ್‌ಬೆಂಚ್ ತೆರೆಯಿರಿ'}</span>
          </button>
        )}

        <button
          className="gov-table-action-btn"
          style={{ width: '100%', padding: '8px 12px', fontSize: '11px', justifyContent: 'center' }}
          onClick={() => navigate('/records/rec-142-3a-thippa')}
        >
          <span>{language === 'en' ? 'View Full Record Details' : 'ದಾಖಲೆ ವಿವರಗಳು'}</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* 5. Expandable Technical Geometry Details Accordion */}
      <details className="gov-details-accordion" style={{ marginTop: '14px' }}>
        <summary className="gov-details-summary">
          <span>{language === 'en' ? 'Advanced Spatial & Coordinate Metadata' : 'ತಾಂತ್ರಿಕ ಜಿಐಎಸ್ ನಿರ್ದೇಶಾಂಕಗಳು'}</span>
        </summary>
        <div className="gov-details-content">
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Spatial Reference: EPSG:3857 (WGS 84 / Pseudo-Mercator) • PostGIS Topology Verified
          </div>
          <div className="gov-table-mono-highlight" style={{ fontSize: '10px', wordBreak: 'break-all', padding: '6px 8px' }}>
            Polygon: [{parcel.points?.slice(0, 4).map(p => `[${p.x}, ${p.y}]`).join(', ')} ... {parcel.points?.length || 4} vertices]
          </div>
          <button
            className="gov-table-action-btn"
            style={{ marginTop: '8px', fontSize: '10.5px', width: '100%', justifyContent: 'center' }}
            onClick={handleDownloadGeoJSON}
          >
            <Download size={12} />
            <span>{language === 'en' ? 'Export GeoJSON Boundary' : 'ಜಿಯೋಜೆಸನ್ ಡೌನ್‌ಲೋಡ್'}</span>
          </button>
        </div>
      </details>
    </div>
  );
};

export default ParcelDetailDrawer;
