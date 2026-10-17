import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, 
  Smartphone, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Clock 
} from 'lucide-react';

export const AdminSystemPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <AppLayout title={language === 'kn' ? 'ವ್ಯವಸ್ಥಾ ಆಡಳಿತ' : 'System Administration'} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">
              {language === 'kn' ? 'ವ್ಯವಸ್ಥಾ ಆಡಳಿತ ಮೇಲ್ವಿಚಾರಣೆ' : 'System Administration'}
            </h1>
            <p className="gov-page-subtitle">
              {language === 'kn'
                ? 'ಭೂಮಿಸೇತು ವ್ಯವಸ್ಥಾ ಸ್ಥಿತಿ, ಪಾತ್ರಗಳು, ಭದ್ರತಾ ನಿಯಂತ್ರಣ ಮತ್ತು ಆಡಿಟ್ ಸಮಗ್ರತೆಯ ಕೇಂದ್ರೀಕೃತ ಮೇಲ್ವಿಚಾರಣೆ.'
                : 'Centralized administrative governance, access control, and platform compliance.'}
            </p>
          </div>
        </div>

        {/* Operational Summaries Bar */}
        <div className="gov-stats-bar">
          <div className="gov-stat-item">
            <span className="gov-stat-number">4</span>
            <span className="gov-stat-label">{language === 'kn' ? 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ' : 'Authorized Personnel'}</span>
            <span className="gov-stat-sub">3 Officers • 1 Admin</span>
          </div>

          <div className="gov-stat-item">
            <span className="gov-stat-number">2</span>
            <span className="gov-stat-label">{language === 'kn' ? 'ಸಕ್ರಿಯ ಸೆಷನ್‌ಗಳು' : 'Active Sessions'}</span>
            <span className="gov-stat-sub">1 Desktop • 1 Mobile Field App</span>
          </div>

          <div className="gov-stat-item">
            <span className="gov-stat-number">1</span>
            <span className="gov-stat-label" style={{ color: '#b45309' }}>{language === 'kn' ? 'ಗಡಿ ವಿವಾದ ಪ್ರಕರಣ' : 'Flagged Discrepancy'}</span>
            <span className="gov-stat-sub">Sy. 142/3A Thippagondanahalli</span>
          </div>

          <div className="gov-stat-item">
            <span className="gov-stat-number">3</span>
            <span className="gov-stat-label">{language === 'kn' ? 'ಆಡಿಟ್ ಬ್ಲಾಕ್‌ಗಳು' : 'Ledger Blocks'}</span>
            <span className="gov-stat-sub">SHA-256 Verified State</span>
          </div>
        </div>

        {/* Issues Requiring Attention */}
        <div className="gov-section">
          <div className="gov-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={15} color="#b45309" />
              <h3>{language === 'kn' ? 'ಗಮನ ಹರಿಸಬೇಕಾದ ಪ್ರಮುಖ ವಿಷಯಗಳು' : 'Operational Issues Requiring Attention'}</h3>
            </div>
            <span className="gov-status-pill status-pill-in-review">1 ACTION REQUIRED</span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                  Spatial Overlap Discrepancy: Survey No. 142/3A (Thippagondanahalli Village)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Deed geometry polygon overlaps 4.2% with government irrigation canal (Khata #0082). Patwari field report pending.
                </div>
              </div>
              <button
                className="gov-table-action-btn"
                style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', borderColor: 'var(--color-primary)' }}
                onClick={() => navigate('/gis')}
              >
                <span>{language === 'kn' ? 'ನಕ್ಷೆಯಲ್ಲಿ ವೀಕ್ಷಿಸಿ' : 'Inspect Overlap'}</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Administrative Directory Links */}
        <div className="gov-section">
          <div className="gov-section-header">
            <h3>{language === 'kn' ? 'ಆಡಳಿತ ನಿರ್ವಹಣಾ ಮಾಡ್ಯೂಲ್‌ಗಳು' : 'Administrative Governance Modules'}</h3>
          </div>

          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div
              className="gov-service-tile"
              onClick={() => navigate('/admin/users')}
            >
              <div className="gov-service-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                <Users size={18} />
              </div>
              <div>
                <div className="gov-service-title">{language === 'kn' ? 'ಬಳಕೆದಾರರು ಮತ್ತು ಪಾತ್ರಗಳು' : 'Users & Roles'}</div>
                <div className="gov-service-desc">{language === 'kn' ? 'ಅಧಿಕಾರಿ ಖಾತೆಗಳು ಮತ್ತು ಅಧಿಕಾರ ನಿರ್ವಹಣೆ' : 'Provision officers and configure RBAC jurisdiction rules.'}</div>
              </div>
            </div>

            <div
              className="gov-service-tile"
              onClick={() => navigate('/admin/sessions')}
            >
              <div className="gov-service-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                <Smartphone size={18} />
              </div>
              <div>
                <div className="gov-service-title">{language === 'kn' ? 'ಸೆಷನ್‌ಗಳು ಮತ್ತು ಭದ್ರತೆ' : 'Sessions & Security'}</div>
                <div className="gov-service-desc">{language === 'kn' ? 'ಸಕ್ರಿಯ ಲಾಗಿನ್‌ಗಳು ಮತ್ತು ಟೋಕನ್ ನಿಯಂತ್ರಣ' : 'Monitor active authenticated devices and revoke tokens.'}</div>
              </div>
            </div>

            <div
              className="gov-service-tile"
              onClick={() => navigate('/admin/health')}
            >
              <div className="gov-service-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                <Activity size={18} />
              </div>
              <div>
                <div className="gov-service-title">{language === 'kn' ? 'ವ್ಯವಸ್ಥಾ ಸ್ಥಿತಿ' : 'System Health'}</div>
                <div className="gov-service-desc">{language === 'kn' ? 'ಸರ್ವರ್ ಮತ್ತು ಡೇಟಾಬೇಸ್ ಚಾಲನಾ ಸ್ಥಿತಿ' : 'Real-time telemetry of runtime, DB, and OCR endpoints.'}</div>
              </div>
            </div>

            <div
              className="gov-service-tile"
              onClick={() => navigate('/audit')}
            >
              <div className="gov-service-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="gov-service-title">{language === 'kn' ? 'ಆಡಿಟ್ ಲೆಡ್ಜರ್' : 'Audit Ledger'}</div>
                <div className="gov-service-desc">{language === 'kn' ? 'ಕ್ರಿಪ್ಟೋಗ್ರಾಫಿಕ್ ರಾಜ್ಯ ಚೈನ್ ಸಮಗ್ರತೆ' : 'Cryptographic SHA-256 chain verification of land titles.'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminSystemPage;
