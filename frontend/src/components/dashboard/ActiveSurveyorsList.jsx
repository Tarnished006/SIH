import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FIELD_SURVEYORS } from '../../data/stitchMockData';
import { Users } from 'lucide-react';

export const ActiveSurveyorsList = () => {
  const { t } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="section-header">
        <h3 className="section-title">
          <Users size={15} color="var(--color-brass)" />
          <span>{t('activeFieldSurveyors')}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(ಮೋಜಣಿದಾರರು)</span>
        </h3>
        <span className="badge badge-sync">4 Active</span>
      </div>

      <div className="surveyors-grid">
        {FIELD_SURVEYORS.map((surv) => (
          <div key={surv.id} className="surveyor-chip">
            <div className="surveyor-avatar">{surv.initials}</div>
            <div className="surveyor-info">
              <span className="surveyor-name">{surv.name}</span>
              <span className="surveyor-zone">{surv.zone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveSurveyorsList;
