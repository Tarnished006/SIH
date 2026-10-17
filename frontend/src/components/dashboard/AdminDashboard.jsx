import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Users, 
  ShieldCheck, 
  Map as MapIcon, 
  FileUp, 
  Database, 
  Activity, 
  Server, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  UserPlus,
  Lock
} from 'lucide-react';

export const AdminDashboard = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Admin summary statistics
  const adminStats = [
    {
      id: 'officers',
      labelEn: 'Registered Officers & Users',
      labelKn: 'ನೋಂದಾಯಿತ ಅಧಿಕಾರಿಗಳು & ಬಳಕೆದಾರರು',
      value: '248',
      noteEn: 'Active RBAC profiles',
      noteKn: 'ಸಕ್ರಿಯ ಆರ್‌ಬಿಎಸಿ ಪ್ರೊಫೈಲ್',
      statusClass: 'success',
    },
    {
      id: 'sessions',
      labelEn: 'Active Auth Sessions',
      labelKn: 'ಚಾಲ್ತಿ ಅಧಿಕೃತ ಸೆಷನ್‌ಗಳು',
      value: '04',
      noteEn: 'Redis token verified',
      noteKn: 'ರೆಡಿಸ್ ಟೋಕನ್ ಪರಿಶೀಲಿತ',
      statusClass: 'normal',
    },
    {
      id: 'records',
      labelEn: 'Cadastral Parcels',
      labelKn: 'ಭೂ ದಾಖಲೆಗಳು',
      value: '4.2M',
      noteEn: 'Karnataka Bhu-Aadhaar',
      noteKn: 'ಕರ್ನಾಟಕ ಭೂ-ಆಧಾರ್',
      statusClass: 'normal',
    },
    {
      id: 'audit_height',
      labelEn: 'Audit Block Height',
      labelKn: 'ಆಡಿಟ್ ಬ್ಲಾಕ್ ಎತ್ತರ',
      value: '#48.1K',
      noteEn: 'Immutable SHA-256',
      noteKn: 'ಅಪರಿವರ್ತನೀಯ ಸರಣಿ',
      statusClass: 'urgent',
    },
  ];

  // Authorized officer registry
  const officerRegistry = [
    {
      id: 'usr-1',
      name: 'Rajesh K. Sharma',
      email: 'tehsildar@lucknow.gov.in',
      role: 'TEHSILDAR',
      roleBadgeClass: 'gov-status-warning',
      jurisdiction: 'Ramanagara Division • Magadi Taluk',
      status: 'ACTIVE',
    },
    {
      id: 'usr-2',
      name: 'Amit Verma',
      email: 'patwari@lucknow.gov.in',
      role: 'PATWARI',
      roleBadgeClass: 'gov-status-progress',
      jurisdiction: 'Halka Thippagondanahalli • Circle 4',
      status: 'ACTIVE',
    },
    {
      id: 'usr-3',
      name: 'National Admin',
      email: 'admin@bhumisetu.gov.in',
      role: 'ADMIN',
      roleBadgeClass: 'gov-status-danger',
      jurisdiction: 'Department of Land Resources (DoLR)',
      status: 'ACTIVE',
    },
    {
      id: 'usr-4',
      name: 'Ramesh Kumar',
      email: 'citizen@india.in',
      role: 'CITIZEN',
      roleBadgeClass: 'gov-status-normal',
      jurisdiction: 'Self-Service Landholder • Nelamangala',
      status: 'ACTIVE',
    },
  ];

  // Core system telemetry
  const systemServices = [
    {
      name: 'PostgreSQL / PostGIS',
      roleEn: 'Spatial Cadastral Database & Topology Engine',
      roleKn: 'ಪ್ರಾದೇಶಿಕ ನಕ್ಷಾ ದತ್ತಾಂಶ ಕೋಶ ಮತ್ತು ಟೋಪೋಲಜಿ ಇಂಜಿನ್',
      status: 'OPERATIONAL',
      metric: 'Connection Pool: 18 active • Latency: 12ms',
    },
    {
      name: 'Redis Broker & Session Vault',
      roleEn: 'Token Invalidation & Asynchronous Queue',
      roleKn: 'ಸೆಷನ್ ನಿರ್ವಹಣೆ ಮತ್ತು ಕ್ಯೂ ಬ್ರೋಕರ್',
      status: 'SYNCHRONIZED',
      metric: 'Active Sessions: 4 • Memory: 42 MB',
    },
    {
      name: 'HuggingFace TrOCR Kannada OCR Engine',
      roleEn: 'Client Preprocessor & Kannada Handwritten OCR',
      roleKn: 'ಕನ್ನಡ ಕೈಬರಹ ಮತ್ತು ಮುದ್ರಿತ ಒಸಿಆರ್ ಇಂಜಿನ್',
      status: 'READY',
      metric: 'Model loaded • Inference p95: 142ms',
    },
    {
      name: 'AWS S3 Presigned Document Store',
      roleEn: 'Direct Client-to-Object Zero-Memory Storage',
      roleKn: 'ನೇರ ಕ್ಲೌಡ್ ದಾಖಲೆ ಸಂಗ್ರಹಾಗಾರ',
      status: 'SECURE',
      metric: 'Zero Express CPU overhead • SHA-256 Verified',
    },
  ];

  return (
    <div className="gov-page-container">
      {/* 1. Functional Header (No personal greetings) */}
      <div className="gov-page-header">
        <div>
          <h2 className="gov-page-title">
            {language === 'en' ? 'System Administration & RBAC Governance' : 'ವ್ಯವಸ್ಥಾ ಆಡಳಿತ & ಪ್ರವೇಶ ನಿಯಂತ್ರಣ'}
          </h2>
          <div className="gov-page-subtitle">
            {language === 'en'
              ? 'National Land Governance Platform • DILRMP Architecture • Access Control & Health'
              : 'ರಾಷ್ಟ್ರೀಯ ಭೂ ಆಡಳಿತ ವೇದಿಕೆ • ಡಿಐಎಲ್‌ಆರ್‌ಎಂಪಿ ವಾಸ್ತುಶಿಲ್ಪ • ಪ್ರವೇಶ ನಿಯಂತ್ರಣ'}
          </div>
        </div>
        <div className="gov-header-badge">
          <span>{language === 'en' ? 'Superuser Console' : 'ಆಡಳಿತಾಧಿಕಾರಿ ನಿಯಂತ್ರಣ'}</span>
        </div>
      </div>

      {/* 2. Concise Admin Statistics Overview Bar */}
      <div className="gov-stats-bar">
        {adminStats.map((st) => (
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

      {/* 3. Authorized Officer & User Directory Table */}
      <section className="gov-section">
        <div className="gov-section-header">
          <div>
            <h3 className="gov-section-title">
              {language === 'en' ? 'Officer & User Access Directory' : 'ಅಧಿಕಾರಿ ಮತ್ತು ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ'}
            </h3>
            <div className="gov-section-subtext">
              {language === 'en'
                ? 'Role-based access control governance across revenue jurisdictions'
                : 'ಕಂದಾಯ ವಿಭಾಗಗಳಾದ್ಯಂತ ಪಾತ್ರ ಆಧಾರಿತ ಪ್ರವೇಶ ನಿಯಂತ್ರಣ ನಿರ್ವಹಣೆ'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="gov-link-action"
              onClick={() => navigate('/admin/users')}
            >
              <span>{language === 'en' ? 'Manage Sessions' : 'ಸೆಷನ್ ನಿರ್ವಹಣೆ'}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Officer / User' : 'ಅಧಿಕಾರಿ / ಬಳಕೆದಾರ'}</th>
                <th>{language === 'en' ? 'Official Email' : 'ಇಮೇಲ್'}</th>
                <th>{language === 'en' ? 'Assigned Role' : 'ಪಾತ್ರ'}</th>
                <th>{language === 'en' ? 'Jurisdiction / Posting' : 'ವ್ಯಾಪ್ತಿ / ನಿಯೋಜನೆ'}</th>
                <th>{language === 'en' ? 'Status' : 'ಸ್ಥಿತಿ'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Access' : 'ಕ್ರಮ'}</th>
              </tr>
            </thead>
            <tbody>
              {officerRegistry.map((off) => (
                <tr key={off.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{off.name}</div>
                  </td>
                  <td>
                    <span className="gov-table-mono-highlight">{off.email}</span>
                  </td>
                  <td>
                    <span className={`gov-status-pill ${off.roleBadgeClass}`}>
                      {off.role}
                    </span>
                  </td>
                  <td className="gov-table-muted-text">
                    {off.jurisdiction}
                  </td>
                  <td>
                    <span className="gov-status-pill gov-status-progress" style={{ fontSize: '9px' }}>
                      {off.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="gov-table-action-btn primary"
                      onClick={() => navigate('/admin/users')}
                    >
                      <span>{language === 'en' ? 'Manage' : 'ನಿರ್ವಹಿಸಿ'}</span>
                      <ChevronRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Consolidated System Health & Infrastructure Telemetry */}
      <section className="gov-section">
        <div className="gov-section-header">
          <div>
            <h3 className="gov-section-title">
              {language === 'en' ? 'Core Infrastructure & Service Telemetry' : 'ಮೂಲಸೌಕರ್ಯ ಮತ್ತು ಸೇವಾ ಸ್ಥಿತಿ'}
            </h3>
            <div className="gov-section-subtext">
              {language === 'en'
                ? 'Consolidated operational telemetry across backend microservices'
                : 'ಹಿನ್ನೆಲೆ ಸೇವೆಗಳು ಮತ್ತು ದತ್ತಾಂಶ ಸಂಪರ್ಕಗಳ ಸ್ಥಿತಿ'}
            </div>
          </div>
          <span className="gov-badge-info">
            {language === 'en' ? 'All Operational' : 'ಎಲ್ಲವೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ'}
          </span>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Infrastructure Component' : 'ಘಟಕ'}</th>
                <th>{language === 'en' ? 'Platform Responsibility' : 'ಕಾರ್ಯ ವ್ಯಾಪ್ತಿ'}</th>
                <th>{language === 'en' ? 'State' : 'ಸ್ಥಿತಿ'}</th>
                <th>{language === 'en' ? 'Telemetry Metric' : 'ಕಾರ್ಯಾಚರಣೆ ವಿವರ'}</th>
              </tr>
            </thead>
            <tbody>
              {systemServices.map((srv) => (
                <tr key={srv.name}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{srv.name}</div>
                  </td>
                  <td className="gov-table-muted-text">
                    {language === 'en' ? srv.roleEn : srv.roleKn}
                  </td>
                  <td>
                    <span className="gov-status-pill gov-status-progress" style={{ fontSize: '9.5px' }}>
                      {srv.status}
                    </span>
                  </td>
                  <td>
                    <span className="gov-table-mono-highlight">{srv.metric}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Direct Administrative Module Shortcuts */}
      <section className="gov-section">
        <div className="gov-section-header">
          <h3 className="gov-section-title">
            {language === 'en' ? 'Administrative Workspaces' : 'ಆಡಳಿತಾತ್ಮಕ ವ್ಯವಸ್ಥೆಗಳು'}
          </h3>
        </div>

        <div className="gov-modules-grid">
          <button 
            className="gov-module-card"
            onClick={() => navigate('/admin/users')}
          >
            <Users size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'Session Security Vault' : 'ಸೆಷನ್ ಭದ್ರತಾ ಕೋಶ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Inspect and revoke active device tokens' : 'ಸಕ್ರಿಯ ಸಾಧನ ಟೋಕನ್‌ಗಳ ನಿಯಂತ್ರಣ'}
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
                {language === 'en' ? 'Verify Merkle root and block immutability' : 'ಬ್ಲಾಕ್‌ಚೈನ್ ಸರಣಿ ಪರಿಶೀಲನೆ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>

          <button 
            className="gov-module-card"
            onClick={() => navigate('/records')}
          >
            <Database size={18} color="var(--color-primary)" />
            <div className="gov-module-card-text">
              <div className="gov-module-card-title">
                {language === 'en' ? 'State Cadastral Directory' : 'ರಾಜ್ಯ ಭೂ ದಾಖಲೆಗಳ ಕೋಶ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Search 4.2M records across revenue circles' : '4.2 ಮಿಲಿಯನ್ ದಾಖಲೆಗಳ ಸಮಗ್ರ ಕೋಶ'}
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
                {language === 'en' ? 'National GIS Cadastre' : 'ರಾಷ್ಟ್ರೀಯ ಜಿಐಎಸ್ ನಕ್ಷೆ'}
              </div>
              <div className="gov-module-card-desc">
                {language === 'en' ? 'Statewide spatial vector layers' : 'ರಾಜ್ಯಮಟ್ಟದ ನಕ್ಷಾ ಗಡಿ ಪರಿಶೀಲನೆ'}
              </div>
            </div>
            <ArrowRight size={13} className="gov-module-card-arrow" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
