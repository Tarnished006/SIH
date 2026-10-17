import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AlertTriangle } from 'lucide-react';

export const SpatialDiscrepancyBanner = ({ discrepancy }) => {
  const { t } = useLanguage();

  const title = discrepancy?.title || t('spatialDiscrepancyFlagged');
  const badge = discrepancy?.badge || 'Δ 1.2M';
  const description = discrepancy?.description || t('spatialDiscrepancyDesc');

  return (
    <div className="discrepancy-banner">
      <div className="discrepancy-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={15} color="var(--color-danger)" />
          <span>{title}</span>
        </div>
        <span className="badge badge-urgent" style={{ fontWeight: 800 }}>
          {badge}
        </span>
      </div>
      <div className="discrepancy-text">
        {description}
      </div>
    </div>
  );
};

export default SpatialDiscrepancyBanner;
