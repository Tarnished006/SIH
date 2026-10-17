import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ClipboardList, 
  Map as MapIcon, 
  FileUp, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  FolderKanban,
  AlertTriangle
} from 'lucide-react';

export const PatwariDashboard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Field verification stats
  const patwariStats = [
    {
      id: 'assigned',
      labelEn: 'Assigned Field Cases',
      labelKn: 'ನಿಯೋಜಿತ ಕ್ಷೇತ್ರ ಪರಿಶೀಲನೆಗಳು',
      value: '14',
      noteEn: '4 require prompt visit',
      noteKn: '4 ತುರ್ತು ಭೇಟಿ ಅಗತ್ಯ',
      statusClass: 'urgent',
    },
    {
      id: 'conflicts',
      labelEn: 'Boundary Pegging Required',
      labelKn: 'ಗಡಿ ಗುರುತು ಅಗತ್ಯವಿರುವ ಸರ್ವೆಗಳು',
      value: '03',
      noteEn: 'Overlap reported on-ground',
      noteKn: 'ಅತಿಕ್ರಮಣ ಪತ್ತೆ',
      statusClass: 'warning',
    },
    {
      id: 'intake',
      labelEn: 'Pending Intake Scans',
      labelKn: 'ದಾಖಲೆ ಸ್ಕ್ಯಾನ್ ಸಲ್ಲಿಕೆಗಳು',
      value: '08',
      noteEn: 'Ready for verification',
      noteKn: 'ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧ',
      statusClass: 'normal',
    },
    {
      id: 'halka_records',
      labelEn: 'Digitized Halka Parcels',
      labelKn: 'ಹಲ್ಕಾದ ಒಟ್ಟು ಗಣಕೀಕೃತ ದಾಖಲೆಗಳು',
      value: '3,420',
      noteEn: 'Circle 4 Nelamangala',
      noteKn: 'ವೃತ್ತ 4 ನೆಲಮಂಗಲ',
      statusClass: 'success',
    },
  ];

  // Assigned cases for field inspection
  const fieldCases = [
    {
      id: 'rec-142-3a-thippa',
      surveyNumber: '142/3A',
      village: 'Thippagondanahalli',
      villageKn: 'ತಿಪ್ಪಗೊಂಡನಹಳ್ಳಿ',
      holder: 'Ramakrishnaiah S/o Venkatappa',
      taskEn: 'Perimeter survey & dispute verification (+1.2m East axis)',
      taskKn: 'ಪೂರ್ವ ಗಡಿ ಅತಿಕ್ರಮಣ ಪರಿಶೀಲನೆ (+1.2 ಮೀ)',
      priority: 'URGENT',
      priorityClass: 'gov-status-danger',
    },
    {
      id: 'rec-184-3-tavarekere',
      surveyNumber: '184/3',
      village: 'Tavarekere',
      villageKn: 'ತಾವರೆಕೆರೆ',
      holder: 'Chennappa Gowda → Manjunath C.',
      taskEn: 'Validate legal heir family tree & consent certificate',
      taskKn: 'ವಾರಸುದಾರರ ವಂಶವೃಕ್ಷ & ಒಪ್ಪಿಗೆ ಪತ್ರ ಪರಿಶೀಲನೆ',
      priority: 'SCHEDULED',
      priorityClass: 'gov-status-warning',
    },
    {
      id: 'rec-101-verified',
      surveyNumber: '101/A',
      village: 'Kudur',
      villageKn: 'ಕೂಡೂರು',
      holder: 'Ram Prasad & Shyam Prasad',
      taskEn: 'Joint partition physical demarcations review',
      taskKn: 'ಜಂಟಿ ವಿಭಜನೆ ಗಡಿ ನಕ್ಷೆ ತಪಾಸಣೆ',
      priority: 'ROUTINE',
      priorityClass: 'gov-status-progress',
    },
  ];

  return (
    <div className="gov-page-container">
      {/* 1. Functional Header (No personal greetings) */}
      <div className="gov-page-header">
        <div>
          <h2 className="gov-page-title">
            {language === 'en' ? 'Village Revenue Field Station' : 'ಗ್ರಾಮ ಲೆಕ್ಕಿಗರ ಕಾರ್ಯಸ್ಥಳ'}
          </h2>
          <div className="gov-page-subtitle">
            {language === 'en'
              ? 'Halka Thippagondanahalli • Circle 4, Nelamangala Taluk • Field Verification'
              : 'ಹಲ್ಕಾ ತಿಪ್ಪಗೊಂಡನಹಳ್ಳಿ • ವೃತ್ತ 4, ನೆಲಮಂಗಲ ತಾಲ್ಲೂಕು • ಸ್ಥಳ ಪರಿಶೀಲನಾ ಕೇಂದ್ರ'}
          </div>
        </div>
        <div className="gov-header-badge">
          <span>{language === 'en' ? 'Field Station (Patwari)' : 'ಗ್ರಾಮ ಆಡಳಿತ (ಪಟವಾರಿ)'}</span>
        </div>
      </div>

      {/* 2. Concise Field Statistics Overview Bar */}
      <div className="gov-stats-bar">
        {patwariStats.map((st) => (
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

      {/* 3. Assigned Field Inspection Cases Table */}
      <section className="gov-section">
        <div className="gov-section-header">
          <div>
            <h3 className="gov-section-title">
              {language === 'en' ? 'Assigned Field Verification Tasks' : 'ನಿಯೋಜಿತ ಕ್ಷೇತ್ರ ಪರಿಶೀಲನಾ ಕಾರ್ಯಗಳು'}
            </h3>
            <div className="gov-section-subtext">
              {language === 'en'
                ? 'Tasks requiring on-ground physical inspection before Tehsildar statutory endorsement'
                : 'ತಹಶೀಲ್ದಾರ್ ಆದೇಶಕ್ಕೆ ಮುಂಚಿತವಾಗಿ ಸ್ಥಳ ಪರಿಶೀಲನೆ ನಡೆಸಬೇಕಾದ ಕಡತಗಳು'}
            </div>
          </div>
          <button 
            className="gov-link-action"
            onClick={() => navigate('/review')}
          >
            <span>{language === 'en' ? 'View All Tasks (14)' : 'ಎಲ್ಲಾ ಕಾರ್ಯಗಳು (14)'}</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Survey No.' : 'ಸರ್ವೆ ನಂ.'}</th>
                <th>{language === 'en' ? 'Village' : 'ಗ್ರಾಮ'}</th>
                <th>{language === 'en' ? 'Landholder / Applicant' : 'ಖಾತೆದಾರ / ಅರ್ಜಿದಾರ'}</th>
                <th>{language === 'en' ? 'Assigned Field Task' : 'ಕ್ಷೇತ್ರ ಕರ್ತವ್ಯದ ವಿವರ'}</th>
                <th>{language === 'en' ? 'Priority' : 'ಆದ್ಯತೆ'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Action' : 'ಕ್ರಮ'}</th>
              </tr>
            </thead>
            <tbody>
              {fieldCases.map((fc) => (
                <tr key={fc.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>Sy No. {fc.surveyNumber}</div>
                  </td>
                  <td>
                    <div>{language === 'en' ? fc.village : fc.villageKn}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fc.holder}</div>
                  </td>
                  <td className="gov-table-muted-text">
                    {language === 'en' ? fc.taskEn : fc.taskKn}
                  </td>
                  <td>
                    <span className={`gov-status-pill ${fc.priorityClass}`}>
                      {fc.priority}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="gov-table-action-btn primary"
                      onClick={() => navigate(`/review/${fc.id}`)}
                    >
                      <span>{language === 'en' ? 'Field Inspect' : 'ಸ್ಥಳ ತಪಾಸಣೆ'}</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Field Operations Quick Access */}
      <section className="gov-section">
        <div className="gov-section-header">
          <h3 className="gov-section-title">
            {language === 'en' ? 'Field Operational Workspaces' : 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಸ್ಥಳಗಳು'}
          </h3>
          <span className="gov-section-note">
            {language === 'en' ? 'Halka Tools' : 'ಹಲ್ಕಾ ಪರಿಕರಗಳು'}
          </span>
        </div>

        <div className="gov-modules-grid">
          <button 
            className="gov-module-card"
            onClick={() => navigate('/upload')}
          >
            <FileUp size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Deed & RTC Ingestion' : 'ದಾಖಲೆ / ಪಹಣಿ ಅಪ್‌ಲೋಡ್'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Upload new field survey scans and documents' : 'ಹೊಸ ದಾಖಲೆ ಮತ್ತು ಸ್ಕ್ಯಾನ್ ಅಪ್‌ಲೋಡ್'}
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
                {language === 'en' ? 'Halka Cadastral Map' : 'ಹಲ್ಕಾ ಭೂ ನಕ್ಷೆ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Inspect survey boundaries and pegging markers' : 'ಗಡಿ ರೇಖೆಗಳು ಮತ್ತು ಮೋಜಣಿ ತಪಾಸಣೆ'}
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
                {language === 'en' ? 'Halka Land Records' : 'ಹಲ್ಕಾ ಭೂ ದಾಖಲೆಗಳು'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Browse all 3,420 registered parcels in circle' : 'ವೃತ್ತದ ಎಲ್ಲಾ 3,420 ದಾಖಲೆಗಳ ಕೋಶ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>

          <button 
            className="gov-module-card"
            onClick={() => navigate('/review')}
          >
            <ClipboardList size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Full Inspection Queue' : 'ಸಂಪೂರ್ಣ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Review all assigned files awaiting field survey' : 'ಸ್ಥಳ ಪರಿಶೀಲನೆಗೆ ನಿಯೋಜಿತ ಕಡತಗಳು'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PatwariDashboard;
