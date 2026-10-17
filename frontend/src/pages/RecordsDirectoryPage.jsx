import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Search, ChevronRight, FileText, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const RecordsDirectoryPage = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = role === 'CITIZEN' ? '/records/my-applications' : '/records';
      const res = await apiClient.get(endpoint, {
        params: {
          query: query.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });

      if (res.data?.success) {
        const list = res.data.records || res.data.applications || [];
        setRecords(list);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('[FETCH_RECORDS_ERR]', err);
      setError(err.response?.data?.message || err.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [role, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return { className: 'status-pill-verified', textEn: 'Verified & Approved', textKn: 'ಅನುಮೋದಿತ' };
      case 'FORWARDED_TO_TEHSILDAR':
        return { className: 'status-pill-in-review', textEn: 'Awaiting Sanction', textKn: 'ಅನುಮೋದನೆಗೆ ಬಾಕಿ' };
      case 'IN_REVIEW':
        return { className: 'status-pill-pending', textEn: 'Under Review', textKn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ' };
      case 'CORRECTIONS_REQUESTED':
        return { className: 'status-pill-flagged', textEn: 'Corrections Needed', textKn: 'ತಿದ್ದುಪಡಿ ಅಗತ್ಯವಿದೆ' };
      case 'REJECTED':
        return { className: 'status-pill-rejected', textEn: 'Rejected', textKn: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ' };
      default:
        return { className: 'status-pill-pending', textEn: 'Pending Review', textKn: 'ಪರಿಶೀಲನೆಗೆ ಬಾಕಿ' };
    }
  };

  const pageTitle = role === 'CITIZEN'
    ? (language === 'kn' ? 'ನನ್ನ ಭೂ ದಾಖಲೆಗಳು' : 'My Land Records')
    : (language === 'kn' ? 'ಭೂ ದಾಖಲೆಗಳ ಡೈರೆಕ್ಟರಿ' : 'Land Records Directory');

  return (
    <AppLayout title={pageTitle} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">{pageTitle}</h1>
            <p className="gov-page-subtitle">
              {role === 'CITIZEN'
                ? (language === 'kn' ? 'ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ದಾಖಲಾದ ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟ ಕಂದಾಯ ವಿವರಗಳು.' : 'Official digitized land titles and verified revenue records associated with your account.')
                : (language === 'kn' ? 'ಸರ್ಕಾರಿ ದತ್ತಸಂಚಯದಲ್ಲಿರುವ ನೈಜ ಭೂ ದಾಖಲೆಗಳ ಪಟ್ಟಿ.' : 'Master land record repository verified against DILRMP cadastral standards.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="gov-badge-info">
              {records.length} {language === 'kn' ? 'ದಾಖಲೆಗಳು' : 'Records'}
            </span>
            <button
              className="toggle-btn"
              onClick={fetchRecords}
              disabled={loading}
              title="Refresh"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>{language === 'kn' ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: '1 1 300px', maxWidth: '440px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'kn' ? 'ಸರ್ವೆ ನಂ, ULPIN ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ...' : 'Search by Survey No (e.g. 84/2A), ULPIN, Village...'}
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
          </form>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>
              {language === 'kn' ? 'ಸ್ಥಿತಿ:' : 'Status:'}
            </span>
            {[
              { id: 'ALL', labelEn: 'All', labelKn: 'ಎಲ್ಲಾ' },
              { id: 'APPROVED', labelEn: 'Approved', labelKn: 'ಅನುಮೋದಿತ' },
              { id: 'PENDING_REVIEW', labelEn: 'Pending', labelKn: 'ಬಾಕಿ' },
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
                {language === 'kn' ? st.labelKn : st.labelEn}
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
                <th>{language === 'kn' ? 'ಸರ್ವೆ ನಂಬರ್' : 'Survey Number'}</th>
                <th>{language === 'kn' ? 'ಗ್ರಾಮ & ತಾಲೂಕು' : 'Village & Taluk'}</th>
                <th>{language === 'kn' ? 'ವಿಸ್ತೀರ್ಣ (Extent)' : 'Area / Extent'}</th>
                <th>{language === 'kn' ? 'ಭೂ-ಆಧಾರ್ (ULPIN)' : 'ULPIN'}</th>
                <th>{language === 'kn' ? 'ಸ್ಥಿತಿ' : 'Review Status'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'kn' ? 'ಕ್ರಮ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {language === 'kn' ? 'ದಾಖಲೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading land records from database...'}
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    <FileText size={28} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                    <div style={{ fontWeight: 600 }}>
                      {language === 'kn' ? 'ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No records found'}
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const badge = getStatusBadge(rec.reviewStatus);
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => navigate(`/records/${rec.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-primary)' }}>
                          Sy. {rec.surveyNumber}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {rec.landClassification || 'Agricultural'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                          {rec.villageName || 'Karnataka'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          LGD: {rec.villageLgd || '29'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>
                          {rec.rawArea ? `${rec.rawArea} ${rec.rawUnit || 'Acre'}` : '—'}
                        </div>
                        {rec.normalizedAreaHectares && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {Number(rec.normalizedAreaHectares).toFixed(4)} Ha
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                          {rec.ulpin || 'PROVISIONAL'}
                        </span>
                      </td>
                      <td>
                        <span className={`gov-status-pill ${badge.className}`}>
                          {language === 'kn' ? badge.textKn : badge.textEn}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="gov-table-action-btn"
                          onClick={(e) => { e.stopPropagation(); navigate(`/records/${rec.id}`); }}
                          style={{ padding: '6px 12px', fontSize: '11.5px' }}
                        >
                          <span>{language === 'kn' ? 'ವಿವರ ನೋಡಿ' : 'View Record'}</span>
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

export default RecordsDirectoryPage;
