import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DASHBOARD_METRICS } from '../../data/stitchMockData';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  Lock 
} from 'lucide-react';

export const MetricsGrid = ({ metrics = DASHBOARD_METRICS, onSelectMetric = () => {} }) => {
  const { t } = useLanguage();

  return (
    <div className="metrics-grid">
      {/* 1. Pending Mutations */}
      <div 
        className="metric-card" 
        onClick={() => onSelectMetric('pending')}
        style={{ cursor: 'pointer' }}
      >
        <div className="metric-header">
          <div className="metric-icon-box">
            <ClipboardList size={18} />
          </div>
          <span className="badge badge-urgent">{metrics.pendingMutations.badge}</span>
        </div>
        <div className="metric-number">
          <span>{metrics.pendingMutations.count}</span>
          <span className="metric-unit">{metrics.pendingMutations.unit}</span>
        </div>
        <div>
          <div className="metric-label">{t('pendingMutations')}</div>
          <div className="metric-label-kn">{t('pendingMutationsKn')}</div>
        </div>
      </div>

      {/* 2. Digitized Parcels */}
      <div 
        className="metric-card"
        onClick={() => onSelectMetric('parcels')}
        style={{ cursor: 'pointer' }}
      >
        <div className="metric-header">
          <div className="metric-icon-box">
            <CheckCircle2 size={18} />
          </div>
          <span className="badge badge-sync">{metrics.digitizedParcels.badge}</span>
        </div>
        <div className="metric-number">
          <span>{metrics.digitizedParcels.count}</span>
        </div>
        <div>
          <div className="metric-label">{t('digitizedParcels')}</div>
          <div className="metric-label-kn">{t('digitizedParcelsKn')}</div>
        </div>
      </div>

      {/* 3. GIS Conflicts */}
      <div 
        className="metric-card"
        onClick={() => onSelectMetric('conflicts')}
        style={{ cursor: 'pointer' }}
      >
        <div className="metric-header">
          <div className="metric-icon-box" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={18} />
          </div>
          <span className="badge badge-flagged">{metrics.gisConflicts.badge}</span>
        </div>
        <div className="metric-number" style={{ color: 'var(--color-danger)' }}>
          <span>{metrics.gisConflicts.count}</span>
          <span className="metric-unit">{metrics.gisConflicts.unit}</span>
        </div>
        <div>
          <div className="metric-label">{t('gisConflicts')}</div>
          <div className="metric-label-kn">{t('gisConflictsKn')}</div>
        </div>
      </div>

      {/* 4. Daily Ledger Hash */}
      <div 
        className="metric-card"
        onClick={() => onSelectMetric('audit')}
        style={{ cursor: 'pointer' }}
      >
        <div className="metric-header">
          <div className="metric-icon-box" style={{ color: 'var(--color-brass)' }}>
            <Lock size={18} />
          </div>
          <span className="badge badge-immutable">{metrics.dailyLedgerHash.badge}</span>
        </div>
        <div className="metric-number font-mono">
          <span>{metrics.dailyLedgerHash.count}</span>
        </div>
        <div>
          <div className="metric-label">{t('dailyLedgerHash')}</div>
          <div className="metric-label-kn">{t('dailyLedgerHashKn')}</div>
        </div>
      </div>
    </div>
  );
};

export default MetricsGrid;
