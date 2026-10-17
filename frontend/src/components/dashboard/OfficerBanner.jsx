import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, MapPin } from 'lucide-react';

export const OfficerBanner = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <div className="officer-banner">
      <div className="banner-top-strip">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="status-dot"></span>
          <span>{t('systemActive')} • {t('ledgerLive')}</span>
        </div>
        <span className="badge badge-amber">{user?.zoneTag || 'KA-REV-2024'}</span>
      </div>

      <div>
        <h2 className="officer-title">
          {user?.title || t('tehsildarTitle')}
        </h2>
        <div className="officer-role">
          {user?.departmentKn || 'ತಹಶೀಲ್ದಾರ್ ಕಛೇರಿ'} | {user?.department || t('tehsildarOffice')}
        </div>
      </div>

      <div className="jurisdiction-pill">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={13} color="var(--color-brass)" />
          <span>{user?.jurisdictionKn || 'ರಾಮನಗರ • ಮಾಗಡಿ • ಕಸಬಾ ಹೋಬಳಿ'}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ fontSize: '10px' }}>{user?.jurisdiction || 'Ramanagara • Magadi • Kasaba'}</span>
        </div>
        <span className="badge badge-sync" style={{ fontWeight: 800 }}>
          {user?.zoneTag || 'SEC-8A'}
        </span>
      </div>
    </div>
  );
};

export default OfficerBanner;
