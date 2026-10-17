import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, 
  FileText, 
  Map as MapIcon, 
  HelpCircle, 
  CheckSquare, 
  FileUp, 
  ShieldCheck, 
  Users, 
  Smartphone, 
  Activity, 
  LayoutDashboard,
  PlusCircle
} from 'lucide-react';

export const DesktopSidebar = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation Items per role according to official government specifications
  const getNavItemsForRole = () => {
    switch (role) {
      case 'CITIZEN':
        return [
          {
            id: 'applications',
            path: '/applications',
            icon: FileText,
            labelEn: 'My Applications',
            labelKn: 'ನನ್ನ ಅರ್ಜಿಗಳು',
          },
          {
            id: 'upload',
            path: '/upload',
            icon: FileUp,
            labelEn: 'New Application / Upload',
            labelKn: 'ಹೊಸ ಅರ್ಜಿ / ಅಪ್‌ಲೋಡ್',
          },
          {
            id: 'records',
            path: '/records',
            icon: FolderKanban,
            labelEn: 'Land Records',
            labelKn: 'ಭೂ ದಾಖಲೆಗಳು',
          },
          {
            id: 'help',
            path: '/help',
            icon: HelpCircle,
            labelEn: 'Help & Contact',
            labelKn: 'ಸಹಾಯ ಮತ್ತು ಸಂಪರ್ಕ',
          },
        ];

      case 'PATWARI':
        return [
          {
            id: 'review',
            path: '/review',
            icon: CheckSquare,
            labelEn: 'Assigned Cases',
            labelKn: 'ನಿಯೋಜಿತ ಪ್ರಕರಣಗಳು',
          },
          {
            id: 'upload',
            path: '/upload',
            icon: FileUp,
            labelEn: 'Document Intake',
            labelKn: 'ದಾಖಲೆ ಸ್ವೀಕೃತಿ',
          },
          {
            id: 'records',
            path: '/records',
            icon: FolderKanban,
            labelEn: 'Land Records',
            labelKn: 'ಭೂ ದಾಖಲೆಗಳು',
          },
          {
            id: 'audit',
            path: '/audit',
            icon: ShieldCheck,
            labelEn: 'Audit Ledger',
            labelKn: 'ಆಡಿಟ್ ಲೆಡ್ಜರ್',
          },
        ];

      case 'TEHSILDAR':
      default:
        return [
          {
            id: 'review',
            path: '/review',
            icon: CheckSquare,
            labelEn: 'Review Queue',
            labelKn: 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿ',
          },
          {
            id: 'records',
            path: '/records',
            icon: FolderKanban,
            labelEn: 'Land Records',
            labelKn: 'ಭೂ ದಾಖಲೆಗಳು',
          },
          {
            id: 'audit',
            path: '/audit',
            icon: ShieldCheck,
            labelEn: 'Audit Ledger',
            labelKn: 'ಆಡಿಟ್ ಲೆಡ್ಜರ್',
          },
        ];
    }
  };

  const navItems = getNavItemsForRole();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="desktop-sidebar" aria-label="Desktop Navigation Sidebar">
      {/* 1. Official Platform Brand Header */}
      <div 
        className="sidebar-brand" 
        onClick={() => {
          if (role === 'CITIZEN') navigate('/applications');
          else navigate('/review');
        }} 
        style={{ cursor: 'pointer' }}
      >
        <div className="sidebar-brand-emblem">
          <svg width="24" height="24" viewBox="0 0 100 100">
            <polygon points="50,6 94,28 94,72 50,94 6,72 6,28" fill="none" stroke="currentColor" strokeWidth="6" />
            <polygon points="50,22 80,37 80,63 50,78 20,63 20,37" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-title">
            <span>{language === 'en' ? 'BhumiSetu' : 'ಭೂಮಿಸೇತು'}</span>
          </div>
          <div className="sidebar-brand-sub">
            {language === 'en' ? 'Land Records Portal' : 'ಭೂ ದಾಖಲೆಗಳ ಪೋರ್ಟಲ್'}
          </div>
        </div>
      </div>

      {/* 2. Department & Platform Identification Strip */}
      <div className="sidebar-dept-strip">
        <span className="sidebar-dept-text">
          {language === 'en' ? 'Govt. of Karnataka • DILRMP' : 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಕಂದಾಯ ಇಲಾಖೆ'}
        </span>
      </div>

      {/* 3. Role-Filtered Navigation Links List (Single Language Labels) */}
      <nav className="sidebar-nav-menu">
        <div className="sidebar-section-label">
          {language === 'en' ? 'NAVIGATION' : 'ನ್ಯಾವಿಗೇಷನ್'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const currentLabel = language === 'en' ? item.labelEn : item.labelKn;

          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
            >
              <div className="sidebar-nav-item-icon">
                <Icon size={16} />
              </div>

              <span className="sidebar-nav-label-single">
                {currentLabel}
              </span>

              {item.badge && (
                <span className={`badge ${item.badgeClass || 'badge-sync'}`} style={{ fontSize: '9px', padding: '1px 6px', marginLeft: 'auto' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Patwari Quick Document Intake Action Button */}
      {role === 'PATWARI' && (
        <div style={{ padding: '0 12px', marginTop: 'auto', marginBottom: '16px' }}>
          <button
            className="sidebar-quick-action-btn"
            onClick={() => navigate('/upload')}
          >
            <PlusCircle size={14} />
            <span>{language === 'en' ? '+ Document Intake' : '+ ದಾಖಲೆ ಸ್ವೀಕೃತಿ'}</span>
          </button>
        </div>
      )}

      {/* 5. Minimal Portal Compliance Footer */}
      <div className="sidebar-portal-footer" style={{ marginTop: role !== 'PATWARI' ? 'auto' : undefined }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          {language === 'en' ? 'ULPIN Bhu-Aadhaar Standard' : 'ಯುಎಲ್‌ಪಿಐಎನ್ ಭೂ-ಆಧಾರ್ ವ್ಯವಸ್ಥೆ'}
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
