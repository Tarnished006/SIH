import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { PENDING_MUTATION_QUEUE } from '../../data/stitchMockData';
import { 
  CheckSquare, 
  Map as MapIcon, 
  FileUp, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight,
  AlertTriangle,
  FolderKanban
} from 'lucide-react';

export const TehsildarDashboard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Summary statistics for statutory oversight
  const tehsildarStats = [
    {
      id: 'pending',
      labelEn: 'Pending Review Cases',
      labelKn: 'ಬಾಕಿ ಪರಿಶೀಲನಾ ಅರ್ಜಿಗಳು',
      value: '38',
      noteEn: '12 urgent priority',
      noteKn: '12 ತುರ್ತು ಆದ್ಯತೆ',
      statusClass: 'urgent',
    },
    {
      id: 'disputed',
      labelEn: 'Boundary Conflicts',
      labelKn: 'ಗಡಿ ವ್ಯತ್ಯಾಸಗಳು',
      value: '05',
      noteEn: 'Spatial overlap flagged',
      noteKn: 'ನಕ್ಷಾ ಅತಿಕ್ರಮಣ ಪತ್ತೆ',
      statusClass: 'warning',
    },
    {
      id: 'verified',
      labelEn: 'Approved (This Month)',
      labelKn: 'ಅನುಮೋದಿತ ಆದೇಶಗಳು',
      value: '142',
      noteEn: 'Rule 14 Digitally signed',
      noteKn: 'ಡಿಜಿಟಲ್ ಸಹಿ ಪೂರ್ಣ',
      statusClass: 'success',
    },
    {
      id: 'total',
      labelEn: 'Division Cadastral Parcels',
      labelKn: 'ಉಪವಿಭಾಗದ ಒಟ್ಟು ದಾಖಲೆಗಳು',
      value: '4,280',
      noteEn: 'Bhuvan ISRO linked',
      noteKn: 'ಭುವನ್ ಜಿಯೋರೆಫರೆನ್ಸ್',
      statusClass: 'normal',
    },
  ];

  // Primary review queue items needing decision
  const reviewQueue = PENDING_MUTATION_QUEUE.slice(0, 5);

  return (
    <div className="gov-page-container">
      {/* 1. Functional Header (No personal greetings) */}
      <div className="gov-page-header">
        <div>
          <h2 className="gov-page-title">
            {language === 'en' ? 'Revenue Office Review Dashboard' : 'ಕಂದಾಯ ಪರಿಶೀಲನಾ ಮುಖ್ಯಪುಟ'}
          </h2>
          <div className="gov-page-subtitle">
            {language === 'en'
              ? 'Taluk Revenue Adjudication Office • Magadi Division • Statutory Rule 14 Verification'
              : 'ತಾಲ್ಲೂಕು ಕಂದಾಯ ನಿರ್ಣಯ ಕಛೇರಿ • ಮಾಗಡಿ ಉಪವಿಭಾಗ • ನಿಯಮ 14ರ ಪರಿಶೀಲನೆ'}
          </div>
        </div>
        <div className="gov-header-badge">
          <span>{language === 'en' ? 'Statutory Authority' : 'ಸಕ್ಷಮ ಪ್ರಾಧಿಕಾರ'}</span>
        </div>
      </div>

      {/* 2. Concise 4-Stat Overview Bar */}
      <div className="gov-stats-bar">
        {tehsildarStats.map((st) => (
          <div key={st.id} className="gov-stat-item">
            <div className="gov-stat-label">
              {language === 'en' ? st.labelEn : st.labelKn}
            </div>
            <div className="gov-stat-value-row">
              <span className={`gov-stat-number ${st.statusClass}`}>{st.value}</span>
              <span className="gov-stat-note">{language === 'en' ? st.noteEn : st.noteKn}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Prioritized Pending Review Cases Table */}
      <section className="gov-section">
        <div className="gov-section-header">
          <div>
            <h3 className="gov-section-title">
              {language === 'en' ? 'Cases Requiring Statutory Decision' : 'ನಿರ್ಣಯಕ್ಕಾಗಿ ಬಾಕಿ ಇರುವ ಪ್ರಕರಣಗಳು'}
            </h3>
            <div className="gov-section-subtext">
              {language === 'en'
                ? 'Mutation filings prioritized by field inspection reports and discrepancy checks'
                : 'ಕ್ಷೇತ್ರ ಪರಿಶೀಲನಾ ವರದಿ ಮತ್ತು ಗಡಿ ವ್ಯತ್ಯಾಸಗಳ ಆಧಾರದ ಮೇಲೆ ಆದ್ಯತೆ ನೀಡಲಾದ ಅರ್ಜಿಗಳು'}
            </div>
          </div>
          <button 
            className="gov-link-action"
            onClick={() => navigate('/review')}
          >
            <span>{language === 'en' ? 'View Full Queue (38)' : 'ಸಂಪೂರ್ಣ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ (38)'}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Survey No.' : 'ಸರ್ವೆ ನಂ.'}</th>
                <th>{language === 'en' ? 'Village / Hobli' : 'ಗ್ರಾಮ / ಹೋಬಳಿ'}</th>
                <th>{language === 'en' ? 'ULPIN (Bhu-Aadhaar)' : 'ಯುಎಲ್‌ಪಿಐಎನ್'}</th>
                <th>{language === 'en' ? 'Case Type / Tag' : 'ಪ್ರಕರಣದ ವಿವರ'}</th>
                <th>{language === 'en' ? 'Field Verification' : 'ಕ್ಷೇತ್ರ ವರದಿ'}</th>
                <th>{language === 'en' ? 'OCR Clarity' : 'ಒಸಿಆರ್'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Action' : 'ಕ್ರಮ'}</th>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>Sy No. {item.surveyNumber}</div>
                  </td>
                  <td>
                    <div>{language === 'en' ? item.villageName : item.villageNameKn}</div>
                  </td>
                  <td>
                    <span className="gov-table-mono-highlight">{item.ulpin}</span>
                  </td>
                  <td>
                    <span className={`gov-status-pill ${item.tag.includes('DISPUTED') ? 'gov-status-danger' : item.tag.includes('INHERITANCE') ? 'gov-status-warning' : 'gov-status-progress'}`}>
                      {item.tag}
                    </span>
                  </td>
                  <td className="gov-table-muted-text">
                    {item.partyDetails}
                  </td>
                  <td>
                    <span className="gov-table-mono-highlight">{item.ocrConfidence}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="gov-table-action-btn primary"
                      onClick={() => navigate(`/review/${item.id}`)}
                    >
                      <span>{language === 'en' ? 'Adjudicate' : 'ಪರಿಶೀಲಿಸಿ'}</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Officer Operational Shortcuts */}
      <section className="gov-section">
        <div className="gov-section-header">
          <h3 className="gov-section-title">
            {language === 'en' ? 'Revenue Division Modules' : 'ವಿಭಾಗೀಯ ವ್ಯವಸ್ಥೆಗಳು'}
          </h3>
          <span className="gov-section-note">
            {language === 'en' ? 'Statutory Workspaces' : 'ಅಧಿಕೃತ ಕಾರ್ಯಸ್ಥಳಗಳು'}
          </span>
        </div>

        <div className="gov-modules-grid">
          <button 
            className="gov-module-card"
            onClick={() => navigate('/review')}
          >
            <CheckSquare size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Pending Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? '38 Deeds awaiting title endorsement' : '38 ಕಡತಗಳು ತೀರ್ಮಾನಕ್ಕೆ ಬಾಕಿ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>

          <button 
            className="gov-module-card"
            onClick={() => navigate('/gis')}
          >
            <MapIcon size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Cadastral GIS Map' : 'ಭೂ ನಕ್ಷೆ ವೀಕ್ಷಣೆ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Vector parcels & boundary conflict analysis' : 'ಗಡಿ ನಕ್ಷೆ ಮತ್ತು ಸಂಘರ್ಷ ವಿಶ್ಲೇಷಣೆ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>

          <button 
            className="gov-module-card"
            onClick={() => navigate('/records')}
          >
            <FolderKanban size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Land Records Directory' : 'ದಾಖಲೆಗಳ ಕೋಶ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Unified Bhu-Aadhaar registry for division' : 'ಉಪವಿಭಾಗದ ಸಂಪೂರ್ಣ ಭೂಮಿ ಕೋಶ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>

          <button 
            className="gov-module-card"
            onClick={() => navigate('/audit')}
          >
            <ShieldCheck size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Cryptographic Audit Trail' : 'ಲೆಕ್ಕಪರಿಶೋಧನಾ ಲೆಡ್ಜರ್'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Verify immutable SHA-256 signatures' : 'ಡಿಜಿಟಲ್ ಲೆಡ್ಜರ್ ಪರಿಶೀಲನೆ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default TehsildarDashboard;
