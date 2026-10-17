import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Compass, ArrowRight, Crosshair } from 'lucide-react';
import CadastralCanvas from '../common/CadastralCanvas';

export const CadastralGridPreview = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="cadastral-preview-card">
      <div className="cadastral-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={14} color="var(--color-brass)" />
          <span>{t('cadastralGridActiveLayer')}</span>
        </div>
        <span className="badge badge-sync" style={{ background: '#16241c', color: 'var(--color-brass)', borderColor: 'var(--color-brass)' }}>
          {t('gpsRtxLive')}
        </span>
      </div>

      {/* Georeference Strip */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          color: '#ecf0ed',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>LAT 12.0502° N • LON 77.2281° E</span>
        <span style={{ color: 'var(--color-brass)', fontWeight: 700 }}>Zone: KA-04</span>
      </div>

      {/* Cadastral Visual Area */}
      <div className="cadastral-canvas-wrap" onClick={() => navigate('/gis')} style={{ cursor: 'pointer' }}>
        <CadastralCanvas 
          height={140} 
          selectedSurvey="142/3" 
          interactive={false} 
          showLabels={true} 
        />
        
        {/* Floating crosshair overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(22, 51, 35, 0.92)',
            border: '1px solid var(--color-brass)',
            borderRadius: 'var(--radius-xs)',
            padding: '3px 8px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: '#f4f6f0',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Crosshair size={11} color="var(--color-brass)" />
          <span>Sy No. 142/3A • Magadi Rural</span>
        </div>
      </div>

      {/* Bottom Dispute Strip */}
      <div className="cadastral-strip-footer">
        <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
          {t('disputedOverlap')}: 0.14 Gunta (7.4 m²)
        </span>
        <button onClick={() => navigate('/gis')}>
          <span>{t('resolveBoundary')}</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default CadastralGridPreview;
