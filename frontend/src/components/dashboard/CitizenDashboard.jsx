import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Map as MapIcon, 
  FileUp, 
  Search, 
  Download, 
  ChevronRight, 
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const CitizenDashboard = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloadModalRecord, setDownloadModalRecord] = useState(null);

  // Compact Government Land Services Directory (inspired by Bhoomi / Mahabhumi)
  const citizenServices = [
    {
      id: 'view_rtc',
      titleEn: 'View / Download RTC (Pahani)',
      titleKn: 'ಪಹಣಿ (RTC) ವೀಕ್ಷಣೆ / ಡೌನ್‌ಲೋಡ್',
      descEn: 'Digitally signed Form 16 record of rights',
      descKn: 'ದೃಢೀಕೃತ ಹಕ್ಕು ದಾಖಲೆ ಮತ್ತು ಪಹಣಿ',
      icon: FileText,
      action: () => navigate('/records'),
    },
    {
      id: 'apply_mutation',
      titleEn: 'Apply for Mutation',
      titleKn: 'ಮ್ಯುಟೇಶನ್ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ',
      descEn: 'Submit registered sale deed or inheritance',
      descKn: 'ಹೊಸ ಹಕ್ಕು ಬದಲಾವಣೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
      icon: FileUp,
      action: () => navigate('/upload'),
    },
    {
      id: 'cadastral_map',
      titleEn: 'Cadastral Survey Map',
      titleKn: 'ಭೂ ಕಂದಾಯ ನಕ್ಷೆ (GIS)',
      descEn: 'Inspect parcel boundaries & adjacent plots',
      descKn: 'ಸರ್ವೆ ನಂಬರ್ ಗಡಿ ಮತ್ತು ನಕ್ಷೆ ವೀಕ್ಷಣೆ',
      icon: MapIcon,
      action: () => navigate('/gis'),
    },
    {
      id: 'app_status',
      titleEn: 'Check Application Status',
      titleKn: 'ಅರ್ಜಿ ಸ್ಥಿತಿ ಪರಿಶೀಲನೆ',
      descEn: 'Track filing progress & officer endorsements',
      descKn: 'ಅರ್ಜಿ ಪ್ರಗತಿ ಮತ್ತು ಪರಿಶೀಲನಾ ಹಂತ',
      icon: Clock,
      action: () => {
        const el = document.getElementById('citizen-applications-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'bhu_aadhaar',
      titleEn: 'Bhu-Aadhaar (ULPIN) Registry',
      titleKn: 'ಭೂ-ಆಧಾರ್ ಕೋಶ',
      descEn: 'Verify 14-digit geo-referenced parcel ID',
      descKn: '14-ಅಂಕಿಯ ಭೂ-ಆಧಾರ್ ಪರಿಶೀಲನೆ',
      icon: Search,
      action: () => navigate('/records'),
    },
    {
      id: 'conversion_services',
      titleEn: 'Land Records Directory',
      titleKn: 'ಭೂ ದಾಖಲೆಗಳ ಸಂಪೂರ್ಣ ಕೋಶ',
      descEn: 'Search khata, akarbandh & title deeds',
      descKn: 'ಖಾತೆ, ಆಕಾರ್‌ಬಂದ್ ಮತ್ತು ದಾಖಲೆಗಳ ವಿವರ',
      icon: Layers,
      action: () => navigate('/records'),
    },
  ];

  // Citizen Active Applications
  const citizenApplications = [
    {
      appNo: 'REV-KA-2025-0982',
      surveyNo: '142/3A',
      village: 'Thippagondanahalli (ತಿಪ್ಪಗೊಂಡನಹಳ್ಳಿ)',
      mutationType: language === 'en' ? 'Sale Deed Transfer (ಖರೀದಿ ಮ್ಯುಟೇಶನ್)' : 'ಖರೀದಿ ಮ್ಯುಟೇಶನ್',
      stage: language === 'en' ? 'Stage 3/4: Field Inspection' : 'ಹಂತ 3/4: ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆ',
      lastUpdate: '16 Oct 2026',
      status: 'UNDER_INSPECTION',
      nextAction: language === 'en' ? 'Patwari field survey in progress' : 'ಗ್ರಾಮ ಲೆಕ್ಕಿಗರ ಸ್ಥಳ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ',
      recordId: 'rec-142-3a-thippa',
    },
  ];

  // Citizen Authorized Land Holdings
  const citizenParcels = [
    {
      id: 'rec-142-3a-thippa',
      surveyNumber: '142/3A',
      ulpin: 'KA-29-08-014-00142-003A',
      village: 'Thippagondanahalli',
      villageKn: 'ತಿಪ್ಪಗೊಂಡನಹಳ್ಳಿ',
      taluk: 'Nelamangala (ನೆಲಮಂಗಲ)',
      extent: '2 Ac 14 Gt (0.9511 Ha)',
      classification: language === 'en' ? 'Dry (ಖುಷ್ಕಿ)' : 'ಖುಷ್ಕಿ',
      khataNo: '412',
    },
    {
      id: 'rec-88-solur',
      surveyNumber: '88/2',
      ulpin: 'KA-29-08-014-00088-002B',
      village: 'Solur',
      villageKn: 'ಸೋಲೂರು',
      taluk: 'Nelamangala (ನೆಲಮಂಗಲ)',
      extent: '0 Ac 28 Gt (0.2832 Ha)',
      classification: language === 'en' ? 'Residential (ವಸತಿ)' : 'ವಸತಿ',
      khataNo: '108',
    },
  ];

  return (
    <div className="gov-page-container">
      {/* 1. Functional Header (No personal greeting banners) */}
      <div className="gov-page-header">
        <div>
          <h2 className="gov-page-title">
            {language === 'en' ? 'Citizen Land Services' : 'ನಾಗರಿಕ ಭೂ ಸೇವೆಗಳು'}
          </h2>
          <div className="gov-page-subtitle">
            {language === 'en' 
              ? 'Revenue Department • Karnataka Bhoomi Portal & DILRMP Bhu-Aadhaar' 
              : 'ಕಂದಾಯ ಇಲಾಖೆ • ಕರ್ನಾಟಕ ಭೂಮಿ ಪೋರ್ಟಲ್ ಮತ್ತು ಡಿಐಎಲ್‌ಆರ್‌ಎಂಪಿ ಭೂ-ಆಧಾರ್'}
          </div>
        </div>
        <div className="gov-header-badge">
          <span>{language === 'en' ? 'Citizen Self-Service' : 'ನಾಗರಿಕ ಸ್ವಯಂ ಸೇವೆ'}</span>
        </div>
      </div>

      {/* 2. Compact Service Directory Grid */}
      <section className="gov-section">
        <div className="gov-section-header">
          <h3 className="gov-section-title">
            {language === 'en' ? 'Online Land Services' : 'ಆನ್‌ಲೈನ್ ಭೂ ಸೇವೆಗಳು'}
          </h3>
          <span className="gov-section-note">
            {language === 'en' ? 'Direct Citizen Services' : 'ನೇರ ನಾಗರಿಕ ಸೇವೆಗಳು'}
          </span>
        </div>

        <div className="gov-services-grid">
          {citizenServices.map((srv) => {
            const Icon = srv.icon;
            return (
              <button
                key={srv.id}
                className="gov-service-tile"
                onClick={srv.action}
              >
                <div className="gov-service-icon-box">
                  <Icon size={18} />
                </div>
                <div className="gov-service-content">
                  <div className="gov-service-title">
                    {language === 'en' ? srv.titleEn : srv.titleKn}
                  </div>
                  <div className="gov-service-desc">
                    {language === 'en' ? srv.descEn : srv.descKn}
                  </div>
                </div>
                <ChevronRight size={14} className="gov-service-arrow" />
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Concise Active Applications Table */}
      <section className="gov-section" id="citizen-applications-section">
        <div className="gov-section-header">
          <div>
            <h3 className="gov-section-title">
              {language === 'en' ? 'Active Applications' : 'ಚಾಲ್ತಿ ಅರ್ಜಿಗಳು'}
            </h3>
            <div className="gov-section-subtext">
              {language === 'en' 
                ? 'Status of mutation and land title applications' 
                : 'ಹಕ್ಕು ಬದಲಾವಣೆ ಮತ್ತು ದಾಖಲೆ ಅರ್ಜಿಗಳ ಪ್ರಗತಿ'}
            </div>
          </div>
          <span className="gov-badge-info">
            {citizenApplications.length} {language === 'en' ? 'Active Filing' : 'ಅರ್ಜಿ'}
          </span>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Application No.' : 'ಅರ್ಜಿ ಸಂಖ್ಯೆ'}</th>
                <th>{language === 'en' ? 'Survey & Village' : 'ಸರ್ವೆ ನಂ. ಮತ್ತು ಗ್ರಾಮ'}</th>
                <th>{language === 'en' ? 'Application Type' : 'ಅರ್ಜಿ ವಿಧಾನ'}</th>
                <th>{language === 'en' ? 'Status' : 'ಸ್ಥಿತಿ'}</th>
                <th>{language === 'en' ? 'Last Updated' : 'ಕೊನೆಯ ನವೀಕರಣ'}</th>
                <th>{language === 'en' ? 'Next Step' : 'ಮುಂದಿನ ಹಂತ'}</th>
              </tr>
            </thead>
            <tbody>
              {citizenApplications.map((app) => (
                <tr key={app.appNo}>
                  <td>
                    <span className="gov-table-mono-highlight">{app.appNo}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>Sy No. {app.surveyNo}</div>
                    <div className="gov-table-muted-text">{app.village}</div>
                  </td>
                  <td>{app.mutationType}</td>
                  <td>
                    <span className="gov-status-pill gov-status-progress">
                      {app.stage}
                    </span>
                  </td>
                  <td className="gov-table-muted-text">{app.lastUpdate}</td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                      {app.nextAction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Authorized Land Holdings Table */}
      <section className="gov-section">
        <div className="gov-section-header">
          <div>
            <h3 className="gov-section-title">
              {language === 'en' ? 'Authorized Land Holdings' : 'ನೋಂದಾಯಿತ ಭೂ ಹಿಡುವಳಿಗಳು'}
            </h3>
            <div className="gov-section-subtext">
              {language === 'en' 
                ? 'Parcels registered under your Bhu-Aadhaar profile' 
                : 'ನಿಮ್ಮ ಖಾತೆಯಡಿ ನೋಂದಾಯಿತ ಭೂ ಸರ್ವೆ ನಂಬರ್‌ಗಳು'}
            </div>
          </div>
          <button 
            className="gov-link-action"
            onClick={() => navigate('/records')}
          >
            <span>{language === 'en' ? 'View All Records' : 'ಎಲ್ಲಾ ದಾಖಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ'}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Survey & Hissa' : 'ಸರ್ವೇ & ಹಿಸ್ಸಾ'}</th>
                <th>{language === 'en' ? 'ULPIN (Bhu-Aadhaar)' : 'ಯುಎಲ್‌ಪಿಐಎನ್ (ಭೂ-ಆಧಾರ್)'}</th>
                <th>{language === 'en' ? 'Village / Taluk' : 'ಗ್ರಾಮ / ತಾಲ್ಲೂಕು'}</th>
                <th>{language === 'en' ? 'Extent' : 'ವಿಸ್ತೀರ್ಣ'}</th>
                <th>{language === 'en' ? 'Khata No.' : 'ಖಾತಾ ಸಂ.'}</th>
                <th>{language === 'en' ? 'Classification' : 'ಭೂಮಿ ವಿಧ'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Actions' : 'ಕ್ರಮಗಳು'}</th>
              </tr>
            </thead>
            <tbody>
              {citizenParcels.map((parcel) => (
                <tr key={parcel.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>Sy No. {parcel.surveyNumber}</div>
                  </td>
                  <td>
                    <span className="gov-table-mono-highlight">{parcel.ulpin}</span>
                  </td>
                  <td>
                    <div>{language === 'en' ? parcel.village : parcel.villageKn}</div>
                    <div className="gov-table-muted-text">{parcel.taluk}</div>
                  </td>
                  <td>{parcel.extent}</td>
                  <td>{parcel.khataNo}</td>
                  <td>{parcel.classification}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        className="gov-table-action-btn"
                        onClick={() => navigate('/gis')}
                        title={language === 'en' ? 'View on GIS Map' : 'ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ'}
                      >
                        <MapIcon size={12} />
                        <span>{language === 'en' ? 'Map' : 'ನಕ್ಷೆ'}</span>
                      </button>
                      <button
                        className="gov-table-action-btn primary"
                        onClick={() => navigate(`/records/${parcel.id}`)}
                        title={language === 'en' ? 'View Record & RTC' : 'ದಾಖಲೆ ವೀಕ್ಷಿಸಿ'}
                      >
                        <FileText size={12} />
                        <span>{language === 'en' ? 'Record' : 'ದಾಖಲೆ'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CitizenDashboard;
