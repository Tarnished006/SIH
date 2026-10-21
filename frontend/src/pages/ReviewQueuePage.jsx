import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { 
  Search, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';

export const ReviewQueuePage = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState(location.state?.search || '');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/review/queue');
      if (res.data?.success && Array.isArray(res.data.queue)) {
        setQueue(res.data.queue);
      } else {
        setQueue([]);
      }
    } catch (err) {
      console.error('[REVIEW_QUEUE_ERR]', err);
      setError(err.response?.data?.message || err.message || 'Error loading review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [role]);

  const filteredQueue = queue.filter((item) => {
    const matchesSearch = !searchFilter.trim() || 
      (item.surveyNumber && item.surveyNumber.toLowerCase().includes(searchFilter.toLowerCase().trim())) ||
      (item.villageName && item.villageName.toLowerCase().includes(searchFilter.toLowerCase().trim())) ||
      (item.ulpin && item.ulpin.toLowerCase().includes(searchFilter.toLowerCase().trim())) ||
      (item.applicationNo && item.applicationNo.toLowerCase().includes(searchFilter.toLowerCase().trim()));

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'FORWARDED' && item.reviewStatus === 'FORWARDED_TO_TEHSILDAR') ||
      (statusFilter === 'PENDING' && (item.reviewStatus === 'PENDING_REVIEW' || item.reviewStatus === 'SUBMITTED')) ||
      (statusFilter === 'CORRECTIONS' && item.reviewStatus === 'CORRECTIONS_REQUESTED');

    return matchesSearch && matchesStatus;
  });

  const handleOpenRecord = (item) => {
    if (!item?.id) return;
    navigate(`/review/${item.id}`, {
      state: {
        from: '/review',
        search: searchFilter,
      },
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FORWARDED_TO_TEHSILDAR':
        return {
          className: 'status-pill-in-review',
          textEn: 'Forwarded to Tehsildar',
          textKn: 'ತಹಶೀಲ್ದಾರರಿಗೆ ರವಾನಿಸಲಾಗಿದೆ',
        };
      case 'IN_REVIEW':
        return {
          className: 'status-pill-pending',
          textEn: 'Under Review',
          textKn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
        };
      case 'CORRECTIONS_REQUESTED':
        return {
          className: 'status-pill-flagged',
          textEn: 'Corrections Needed',
          textKn: 'ತಿದ್ದುಪಡಿ ಅಗತ್ಯವಿದೆ',
        };
      case 'PENDING_REVIEW':
      case 'SUBMITTED':
      default:
        return {
          className: 'status-pill-pending',
          textEn: 'Pending Inspection',
          textKn: 'ಪರಿಶೀಲನೆಗೆ ಬಾಕಿ',
        };
    }
  };

  const pageTitle = role === 'PATWARI' 
    ? (language === 'en' ? 'Assigned Cases Queue' : 'ನಿಯೋಜಿತ ಪ್ರಕರಣಗಳು')
    : (language === 'en' ? 'Tehsildar Review & Verification Queue' : 'ತಹಶೀಲ್ದಾರ್ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ');

  const pageSubtitle = role === 'PATWARI'
    ? (language === 'en' 
        ? 'Inspect uploaded deed scans, correct AI-extracted fields, and submit to Tehsildar.'
        : 'ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಎಐ ದತ್ತಾಂಶವನ್ನು ತಿದ್ದಿ ತಹಶೀಲ್ದಾರರಿಗೆ ಸಲ್ಲಿಸಿ.')
    : (language === 'en'
        ? 'Statutory review queue of applications submitted for final approval or rejection.'
        : 'ಅಂತಿಮ ಅನುಮೋದನೆ ಅಥವಾ ತಿರಸ್ಕಾರಕ್ಕಾಗಿ ಸಲ್ಲಿಸಲಾದ ಅರ್ಜಿಗಳ ಪಟ್ಟಿ.');

  return (
    <AppLayout desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">{pageTitle}</h1>
            <div className="gov-page-subtitle">{pageSubtitle}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="gov-badge-info">
              {filteredQueue.length} {language === 'en' ? 'Cases in Queue' : 'ಪ್ರಕರಣಗಳು'}
            </span>
            <button
              className="toggle-btn"
              onClick={loadQueue}
              disabled={loading}
              title="Refresh Queue"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>{language === 'en' ? 'Refresh' : 'ನವೀಕರಿಸಿ'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '440px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={language === 'en' ? 'Search by Survey No, Village, App No, or Citizen Username (@username)...' : 'ಸರ್ವೆ ನಂ, ಗ್ರಾಮ, ಅಥವಾ ನಾಗರಿಕರ ಬಳಕೆದಾರ ಹೆಸರು (@username)...'}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                fontSize: '13px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>
              {language === 'en' ? 'Status:' : 'ಸ್ಥಿತಿ:'}
            </span>
            {[
              { id: 'ALL', labelEn: 'All', labelKn: 'ಎಲ್ಲಾ' },
              { id: 'PENDING', labelEn: 'Pending', labelKn: 'ಬಾಕಿ' },
              { id: 'FORWARDED', labelEn: 'Forwarded', labelKn: 'ರವಾನಿಸಲಾಗಿದೆ' },
              { id: 'CORRECTIONS', labelEn: 'Corrections', labelKn: 'ತಿದ್ದುಪಡಿ' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: statusFilter === st.id ? 'var(--color-primary)' : 'var(--border-subtle)',
                  backgroundColor: statusFilter === st.id ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: statusFilter === st.id ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {language === 'en' ? st.labelEn : st.labelKn}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'en' ? 'Application / Record' : 'ಅರ್ಜಿ ಸಂಖ್ಯೆ'}</th>
                <th>{language === 'en' ? 'Citizen Account' : 'ನಾಗರಿಕರ ಖಾತೆ'}</th>
                <th>{language === 'en' ? 'Survey No & Village' : 'ಸರ್ವೆ ನಂ & ಗ್ರಾಮ'}</th>
                <th>{language === 'en' ? 'Area / Extent' : 'ವಿಸ್ತೀರ್ಣ'}</th>
                <th>{language === 'en' ? 'OCR Confidence' : 'ಎಐ ನಿಖರತೆ'}</th>
                <th>{language === 'en' ? 'Review Status' : 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ'}</th>
                <th>{language === 'en' ? 'Remarks & Notes' : 'ಷರಾ'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'en' ? 'Action' : 'ಕ್ರಮ'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {language === 'en' ? 'Loading review cases from database...' : 'ಪ್ರಕರಣಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'}
                  </td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={28} color="var(--color-success)" />
                      <div style={{ fontWeight: 600 }}>
                        {language === 'en' ? 'Queue is clear!' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿ ಖಾಲಿಯಾಗಿದೆ!'}
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        {language === 'en'
                          ? 'No pending applications currently require officer review.'
                          : 'ಪ್ರಸ್ತುತ ಪರಿಶೀಲನೆಗೆ ಯಾವುದೇ ಬಾಕಿ ಅರ್ಜಿಗಳಿಲ್ಲ.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => {
                  const badge = getStatusBadge(item.reviewStatus);
                  const confidence = item.overallConfidence 
                    ? (Number(item.overallConfidence) * 100).toFixed(1) 
                    : null;

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleOpenRecord(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="font-mono" style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-primary)' }}>
                          {item.applicationNo || `REC-${item.id.slice(0, 8).toUpperCase()}`}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.document?.originalFilename || 'Deed Document'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>
                          Sy. {item.surveyNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.villageName || 'Karnataka'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>
                          {item.rawArea ? `${item.rawArea} ${item.rawUnit || 'Acre'}` : '—'}
                        </div>
                        {item.normalizedAreaHectares && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {Number(item.normalizedAreaHectares).toFixed(4)} Ha
                          </div>
                        )}
                      </td>
                      <td>
                        {confidence ? (
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: Number(confidence) >= 80 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {confidence}%
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        <span className={`gov-status-pill ${badge.className}`}>
                          {language === 'en' ? badge.textEn : badge.textKn}
                        </span>
                      </td>
                      <td style={{ maxWidth: '220px' }}>
                        {item.operatorRemarks ? (
                          <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                            {item.operatorRemarks}
                          </div>
                        ) : item.correctionsRequested ? (
                          <div style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                            {item.correctionsRequested}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting review</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="gov-table-action-btn primary"
                          onClick={(e) => { e.stopPropagation(); handleOpenRecord(item); }}
                          style={{ padding: '6px 12px', fontSize: '11.5px' }}
                        >
                          <span>{role === 'PATWARI' ? (language === 'en' ? 'Review & Edit' : 'ಪರಿಶೀಲಿಸಿ') : (language === 'en' ? 'Verify & Sanction' : 'ಪರಿಶೀಲಿಸಿ')}</span>
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReviewQueuePage;
