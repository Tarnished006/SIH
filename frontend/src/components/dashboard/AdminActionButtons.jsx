import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { 
  FileUp, 
  Layers, 
  BellRing, 
  ShieldCheck 
} from 'lucide-react';

export const AdminActionButtons = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const actions = [
    {
      id: 'upload',
      titleEn: 'Upload',
      titleKn: 'ಅಪ್ಲೋಡ್',
      icon: FileUp,
      route: '/upload',
    },
    {
      id: 'gis',
      titleEn: 'GIS Map',
      titleKn: 'ನಕ್ಷೆ ವೀಕ್ಷಣೆ',
      icon: Layers,
      route: '/gis',
    },
    {
      id: 'urgent',
      titleEn: 'Urgent',
      titleKn: 'ತುರ್ತು ಲಿಸ್ಟ್',
      icon: BellRing,
      route: '/review',
    },
    {
      id: 'audit',
      titleEn: 'Audit',
      titleKn: 'ಲೆಕ್ಕಪರಿಶೋಧನೆ',
      icon: ShieldCheck,
      route: '/audit',
    },
  ];

  return (
    <div className="actions-section">
      <div className="section-header">
        <h3 className="section-title">
          <span>{t('adminActionsTitle')}</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>{t('adminActionsKn')}</span>
        </h3>
        <span className="section-hint">{t('tapToTrigger')}</span>
      </div>

      <div className="action-buttons-grid">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              className="action-card-btn"
              onClick={() => navigate(act.route)}
              aria-label={`${act.titleEn} - ${act.titleKn}`}
            >
              <div className="action-btn-icon">
                <Icon size={17} />
              </div>
              <div className="action-btn-text">{act.titleEn}</div>
              <div className="action-btn-sub">{act.titleKn}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActionButtons;
