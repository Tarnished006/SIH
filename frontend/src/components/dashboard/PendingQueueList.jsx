import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { PENDING_MUTATION_QUEUE } from '../../data/stitchMockData';
import { ArrowRight, ChevronRight, PenTool } from 'lucide-react';

export const PendingQueueList = ({ items = PENDING_MUTATION_QUEUE, limit = 3 }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const displayed = items.slice(0, limit);

  const getTagBadgeClass = (tag) => {
    if (tag.includes('DISPUTED')) return 'badge-urgent';
    if (tag.includes('INHERITANCE')) return 'badge-amber';
    return 'badge-sync';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="section-header">
        <div>
          <h3 className="section-title">
            <span>{t('pendingMutationQueue')}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({t('pendingMutationQueueKn')})</span>
          </h3>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {t('priorityHighDiscrepancy')}
          </div>
        </div>
        <button 
          onClick={() => navigate('/review')}
          style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--color-brass-dark)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px' 
          }}
        >
          <span>{t('viewAll')} (38)</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="queue-list">
        {displayed.map((item, index) => {
          const seqNumber = String(index + 1).padStart(2, '0');
          return (
            <div 
              key={item.id} 
              className="queue-card"
              onClick={() => navigate(`/review/${item.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="queue-seq">{seqNumber}</div>

              <div className="queue-info">
                <div className="queue-title-row">
                  <span className="queue-survey">{t('syNo')} {item.surveyNumber}</span>
                  <span className={`badge ${getTagBadgeClass(item.tag)}`}>{item.tag}</span>
                  <span className="badge badge-sync" style={{ fontSize: '8.5px' }}>{item.ocrConfidence}</span>
                </div>

                <div className="queue-village">
                  {t('village')}: {item.villageName} ({item.villageNameKn})
                </div>

                <div className="queue-ulpin">
                  {t('ulpin')}: {item.ulpin}
                </div>

                <div className="queue-subtext">
                  {item.partyDetails}
                </div>
              </div>

              <div>
                {item.actionType === 'endorse' ? (
                  <button 
                    className="queue-action-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/review/${item.id}`); }}
                    style={{ backgroundColor: 'var(--color-brass-dark)' }}
                  >
                    <span>{t('endorseAction')}</span>
                    <PenTool size={11} />
                  </button>
                ) : (
                  <button 
                    className="queue-action-btn"
                    onClick={(e) => { e.stopPropagation(); navigate(`/review/${item.id}`); }}
                  >
                    <span>{item.actionType === 'inspect' ? t('inspectAction') : t('reviewAction')}</span>
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingQueueList;
