import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import CadastralCanvas from '../components/common/CadastralCanvas';
import ParcelDetailDrawer from '../components/gis/ParcelDetailDrawer';
import Modal from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CADASTRAL_PARCELS_MAP } from '../data/stitchMockData';
import { 
  Building2, 
  Search, 
  X, 
  Layers, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Crosshair,
  FileCheck
} from 'lucide-react';

export const CadastralMapPage = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('142/3');
  const [selectedParcel, setSelectedParcel] = useState(CADASTRAL_PARCELS_MAP[3]); // 142/3
  const [activeLayer, setActiveLayer] = useState('boundaries'); // 'boundaries' | 'overlaps'
  const [showOverlapModal, setShowOverlapModal] = useState(false);

  // Zoom & Pan state for Cadastral Canvas
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 0.75;
  const MAX_ZOOM = 2.5;
  const ZOOM_STEP = 0.25;

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAX_ZOOM, +(prev + ZOOM_STEP).toFixed(2)));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MIN_ZOOM, +(prev - ZOOM_STEP).toFixed(2)));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedParcel(CADASTRAL_PARCELS_MAP[3]);
  }, []);

  // Keyboard accessibility (+, -, 0)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  const handleSelectParcel = (parcel) => {
    setSelectedParcel(parcel);
    setSearchQuery(parcel.surveyNumber);
  };

  const filteredParcels = CADASTRAL_PARCELS_MAP.filter((p) => {
    if (!searchQuery) return true;
    return p.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const hasOverlap = selectedParcel?.surveyNumber === '142/3';

  return (
    <AppLayout desktopExpanded={true} fullWidth={true} noPadding={true}>
      <div className="gov-gis-container">
        {/* Compact Single Search & Layer Toolbar */}
        <div className="gov-gis-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
            <Building2 size={16} color="var(--color-primary)" />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'en' ? 'Thippagondanahalli Village' : 'ತಿಪ್ಪಗೊಂಡನಹಳ್ಳಿ'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {language === 'en' ? 'Kasaba Hobli • Nelamangala' : 'ಕಸಬಾ ಹೋಬಳಿ • ನೆಲಮಂಗಲ'}
              </div>
            </div>
          </div>

          {/* Compact Single Search Field */}
          <div className="gov-gis-search-wrapper">
            <Search size={14} className="gov-gis-search-icon" />
            <input
              type="text"
              className="gov-gis-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search Survey No. (e.g. 142/3, 88/2)...' : 'ಸರ್ವೇ ನಂ. ಹುಡುಕಿ (142/3)...'}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="gov-gis-search-clear"
                title="Clear"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Layer Controls */}
          <div className="gov-gis-layers">
            <button
              className={`gov-gis-layer-btn ${activeLayer === 'boundaries' ? 'active' : ''}`}
              onClick={() => setActiveLayer('boundaries')}
            >
              <Layers size={13} />
              <span>{language === 'en' ? 'Boundaries' : 'ಗಡಿ ರೇಖೆಗಳು'}</span>
            </button>

            <button
              className={`gov-gis-layer-btn ${activeLayer === 'overlaps' ? 'active' : ''} ${hasOverlap ? 'has-alert' : ''}`}
              onClick={() => {
                setActiveLayer('overlaps');
                if (hasOverlap) setShowOverlapModal(true);
              }}
            >
              <AlertTriangle size={13} />
              <span>{language === 'en' ? 'Overlap Check' : 'ಅತಿಕ್ರಮಣ ತಪಾಸಣೆ'}</span>
            </button>
          </div>
        </div>

        {/* Maximized Map Canvas + Docked Right Inspector */}
        <div className="gov-gis-main-split">
          {/* Map Area */}
          <div className="gov-gis-map-canvas-area">
            {/* Compass */}
            <div className="map-control-compass" title="North Arrow">
              <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>▲</span>
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-primary)' }}>N</span>
            </div>

            {/* Scale Bar & Zoom Level Indicator */}
            <div className="map-scale-legend">
              <span>EPSG:3857 | {Math.round(zoom * 100)}% | 50m</span>
            </div>

            {/* Map Canvas Zoom Controls */}
            <div className="map-control-zoom" role="toolbar" aria-label="Map Zoom & Navigation Controls">
              <button 
                className="map-zoom-btn" 
                title={language === 'en' ? 'Zoom In (+)' : 'ದೊಡ್ಡದಾಗಿಸಿ (+)'}
                aria-label="Zoom In"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                style={{ opacity: zoom >= MAX_ZOOM ? 0.4 : 1, cursor: zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer' }}
              >
                <Plus size={14} />
              </button>
              <button 
                className="map-zoom-btn" 
                title={language === 'en' ? 'Zoom Out (−)' : 'ಚಿಕ್ಕದಾಗಿಸಿ (−)'}
                aria-label="Zoom Out"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                style={{ opacity: zoom <= MIN_ZOOM ? 0.4 : 1, cursor: zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer' }}
              >
                <Minus size={14} />
              </button>
              <button 
                className="map-zoom-btn" 
                title={language === 'en' ? 'Reset View & Recenter (0)' : 'ಮರುಹೊಂದಿಸಿ (0)'}
                aria-label="Reset Map View"
                onClick={handleResetZoom}
              >
                <Crosshair size={14} color="var(--color-primary)" />
              </button>
            </div>

            {/* Interactive Vector SVG Canvas with Zoom & Pan */}
            <CadastralCanvas
              parcels={filteredParcels}
              selectedSurvey={selectedParcel?.surveyNumber || '142/3'}
              onSelectParcel={handleSelectParcel}
              height={560}
              showCanal={true}
              interactive={true}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
            />

            {/* Overlap Notice Banner (Shown only when supported by real analysis results) */}
            {hasOverlap && (
              <div className="gov-gis-floating-notice">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#991b1b' }}>
                  <AlertTriangle size={14} color="#dc2626" />
                  <span>
                    {language === 'en'
                      ? 'Boundary Overlap Detected: 7.4 m² with Hissa 142/4'
                      : 'ಅತಿಕ್ರಮಣ ಪತ್ತೆಯಾಗಿದೆ: ಹಿ.ನಂ 142/4 ಜೊತೆ 7.4 ಚ.ಮೀ.'}
                  </span>
                </div>

                <button
                  className="gov-gis-notice-btn"
                  onClick={() => setShowOverlapModal(true)}
                >
                  {language === 'en' ? 'Inspect Analysis' : 'ವಿವರ ಪರಿಶೀಲಿಸಿ'}
                </button>
              </div>
            )}
          </div>

          {/* Right-Side Docked Inspector Panel */}
          <div className="gov-gis-sidebar-panel">
            <ParcelDetailDrawer
              parcel={selectedParcel}
              onReviewClick={() => {
                const targetId = selectedParcel?.surveyNumber === '142/3' ? 'rec-142-3a-thippa' : 'rec-184-3-tavarekere';
                navigate(`/review/${targetId}`);
              }}
            />
          </div>
        </div>

        {/* Boundary Analysis Modal */}
        <Modal
          isOpen={showOverlapModal}
          onClose={() => setShowOverlapModal(false)}
          title={language === 'en' ? 'Cadastral Boundary Overlap Analysis' : 'ಗಡಿ ಅತಿಕ್ರಮಣ ವಿಶ್ಲೇಷಣೆ'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
              <AlertTriangle size={20} />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>
                {language === 'en' ? 'Spatial Discrepancy Identified' : 'ಗಡಿ ವ್ಯತ್ಯಾಸ ಪತ್ತೆಯಾಗಿದೆ'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {language === 'en'
                ? 'Spatial polygon intersection identified between Survey 142/3 and adjacent deed Survey 142/4 during automated PostGIS topological verification.'
                : 'ಸರ್ವೆ 142/3 ಮತ್ತು ಪಕ್ಕದ ಜಮೀನು 142/4 ನಡುವೆ 7.4 ಚ.ಮೀ. ವಿಸ್ತೀರ್ಣದ ಗಡಿ ಅತಿಕ್ರಮಣ ಪತ್ತೆಯಾಗಿದೆ.'}
            </div>

            <table className="gov-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>{language === 'en' ? 'Intersection Extent' : 'ಅತಿಕ್ರಮಣ ವಿಸ್ತೀರ್ಣ'}</td>
                  <td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>7.40 m² (0.183 Gunta)</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{language === 'en' ? 'Topology Validity' : 'ಟೋಪೋಲಜಿ ಸ್ಥಿತಿ'}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>Valid EPSG:3857 Closed Polygon</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{language === 'en' ? 'Recommended Action' : 'ಶಿಫಾರಸು'}</td>
                  <td>{language === 'en' ? 'On-ground field inspection by Patwari' : 'ಗ್ರಾಮ ಲೆಕ್ಕಿಗರಿಂದ ಸ್ಥಳ ಪರಿಶೀಲನೆ'}</td>
                </tr>
              </tbody>
            </table>

            {['ADMIN', 'TEHSILDAR', 'PATWARI'].includes(role) && (
              <button
                className="gov-table-action-btn primary"
                style={{ width: '100%', padding: '10px', marginTop: '6px', justifyContent: 'center' }}
                onClick={() => {
                  setShowOverlapModal(false);
                  navigate('/review/rec-142-3a-thippa');
                }}
              >
                <FileCheck size={14} />
                <span>{language === 'en' ? 'Open in Review Workbench' : 'ಪರಿಶೀಲನಾ ವರ್ಕ್‌ಬೆಂಚ್ ತೆರೆಯಿರಿ'}</span>
              </button>
            )}
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};

export default CadastralMapPage;
