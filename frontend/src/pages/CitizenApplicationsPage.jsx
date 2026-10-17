import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import apiClient from '../api/client';
import { Search, ChevronRight, FileText, CheckCircle2, Clock, AlertCircle, PlusCircle, RefreshCw, XCircle } from 'lucide-react';

export const CitizenApplicationsPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/records/my-applications');
      if (res.data?.success) {
        setApplications(res.data.applications || []);
      } else {
        throw new Error(res.data?.error || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('[CITIZEN_APPS_FETCH_ERR]', err);
      setError(err.response?.data?.message || err.message || 'Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'VERIFIED':
        return {
          className: 'status-pill-verified',
          icon: CheckCircle2,
          textEn: 'Approved by Tehsildar',
          textKn: 'ತಹಶೀಲ್ದಾರ್ ಅನುಮೋದಿಸಿದ್ದಾರೆ',
        };
      case 'FORWARDED_TO_TEHSILDAR':
        return {
          className: 'status-pill-in-review',
          icon: Clock,
          textEn: 'Awaiting Tehsildar Sanction',
          textKn: 'ತಹಶೀಲ್ದಾರ್ ಅನುಮೋದನೆಗೆ ಬಾಕಿ ಇದೆ',
        };
      case 'IN_REVIEW':
        return {
          className: 'status-pill-pending',
          icon: Clock,
          textEn: 'Under Patwari Inspection',
          textKn: 'ಪಟ್ವಾರಿ ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ',
        };
      case 'CORRECTIONS_REQUESTED':
        return {
          className: 'status-pill-flagged',
          icon: AlertCircle,
          textEn: 'Corrections Requested',
          textKn: 'ತಿದ್ದುಪಡಿಗಳನ್ನು ಕೋರಲಾಗಿದೆ',
        };
      case 'REJECTED':
        return {
          className: 'status-pill-rejected',
          icon: XCircle,
          textEn: 'Application Rejected',
          textKn: 'ಅರ್ಜಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
        };
      case 'PENDING_REVIEW':
      case 'SUBMITTED':
      default:
        return {
          className: 'status-pill-pending',
          icon: Clock,
          textEn: 'Submitted (Pending Review)',
          textKn: 'ಸಲ್ಲಿಸಲಾಗಿದೆ (ಪರಿಶೀಲನೆಗೆ ಬಾಕಿ)',
        };
    }
  };

  const filtered = applications.filter((app) => {
    const matchesQuery =
      !query ||
      (app.applicationNo && app.applicationNo.toLowerCase().includes(query.toLowerCase())) ||
      (app.surveyNumber && app.surveyNumber.toLowerCase().includes(query.toLowerCase())) ||
      (app.villageName && app.villageName.toLowerCase().includes(query.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'APPROVED' && (app.reviewStatus === 'APPROVED' || app.reviewStatus === 'VERIFIED')) ||
      (statusFilter === 'PENDING' && (app.reviewStatus === 'PENDING_REVIEW' || app.reviewStatus === 'IN_REVIEW' || app.reviewStatus === 'FORWARDED_TO_TEHSILDAR')) ||
      (statusFilter === 'CORRECTIONS' && app.reviewStatus === 'CORRECTIONS_REQUESTED');

    return matchesQuery && matchesStatus;
  });

  return (
    <AppLayout title={language === 'kn' ? 'ನನ್ನ ಅರ್ಜಿಗಳು' : 'My Applications'} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">
              {language === 'kn' ? 'ನನ್ನ ಅರ್ಜಿಗಳು ಮತ್ತು ಸ್ಥಿತಿ' : 'My Land Record Applications'}
            </h1>
            <p className="gov-page-subtitle">
              {language === 'kn'
                ? 'ಭೂಮಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಸಲ್ಲಿಸಲಾದ ಹಕ್ಕು ಬದಲಾವಣೆ, ಪಹಣಿ ಮತ್ತು ಇತರೆ ಅರ್ಜಿಗಳ ಪ್ರಗತಿ ಪರಿಶೀಲನೆ.'
                : 'Track your submitted land records, AI OCR extraction results, remarks, and officer decisions.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="toggle-btn"
              onClick={fetchApplications}
              disabled={loading}
              title="Refresh applications"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>{language === 'kn' ? 'ನವೀಕರಿಸಿ' : 'Refresh'}</span>
            </button>
            <button
              className="btn-approve"
              onClick={() => navigate('/upload')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <PlusCircle size={14} />
              <span>{language === 'kn' ? 'ಹೊಸ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್' : 'New Application'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '440px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'kn' ? 'ಅರ್ಜಿ ಸಂಖ್ಯೆ, ಸರ್ವೆ ನಂ ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ...' : 'Search by Application Number, Survey No, or Village...'}
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
              {language === 'kn' ? 'ಸ್ಥಿತಿ:' : 'Filter:'}
            </span>
            {[
              { id: 'ALL', labelEn: 'All', labelKn: 'ಎಲ್ಲಾ' },
              { id: 'PENDING', labelEn: 'Under Review', labelKn: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ' },
              { id: 'APPROVED', labelEn: 'Approved', labelKn: 'ಅನುಮೋದಿತ' },
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
                {language === 'kn' ? st.labelKn : st.labelEn}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Applications Data Table */}
        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>{language === 'kn' ? 'ಅರ್ಜಿ ಸಂಖ್ಯೆ' : 'Application No'}</th>
                <th>{language === 'kn' ? 'ಸರ್ವೆ ನಂ & ಗ್ರಾಮ' : 'Survey No & Village'}</th>
                <th>{language === 'kn' ? 'ವಿಸ್ತೀರ್ಣ (Extent)' : 'Area / Extent'}</th>
                <th>{language === 'kn' ? 'ಎಐ ನಿಖರತೆ' : 'AI Confidence'}</th>
                <th>{language === 'kn' ? 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ' : 'Status'}</th>
                <th>{language === 'kn' ? 'ಅಧಿಕಾರಿ ಷರಾ (Remarks)' : 'Remarks & Decisions'}</th>
                <th style={{ textAlign: 'right' }}>{language === 'kn' ? 'ವಿವರ' : 'Details'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    {language === 'kn' ? 'ಅರ್ಜಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading applications from government database...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <FileText size={28} color="var(--text-muted)" />
                      <div style={{ fontWeight: 600 }}>
                        {language === 'kn' ? 'ಯಾವುದೇ ಅರ್ಜಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No applications found'}
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        {language === 'kn'
                          ? 'ಹೊಸ ಭೂ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಲು "ಹೊಸ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್" ಕ್ಲಿಕ್ ಮಾಡಿ.'
                          : 'Upload your land record deed to begin AI-powered extraction and official verification.'}
                      </div>
                      <button
                        className="btn-approve"
                        onClick={() => navigate('/upload')}
                        style={{ marginTop: '8px', padding: '7px 14px', fontSize: '12px' }}
                      >
                        <PlusCircle size={14} />
                        <span>{language === 'kn' ? 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload Land Record'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const badge = getStatusBadge(app.reviewStatus);
                  const BadgeIcon = badge.icon;
                  const confidence = typeof app.overallConfidence === 'number' ? (app.overallConfidence * 100).toFixed(1) : parseFloat(app.overallConfidence) ? (parseFloat(app.overallConfidence) * 100).toFixed(1) : null;

                  return (
                    <tr key={app.id}>
                      <td>
                        <div className="font-mono" style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-primary)' }}>
                          {app.applicationNo}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>Sy. {app.surveyNumber || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{app.villageName || 'Karnataka'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>
                          {app.rawArea ? `${app.rawArea} ${app.rawUnit || 'Acre'}` : '—'}
                        </div>
                        {app.normalizedAreaHectares && (
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {Number(app.normalizedAreaHectares).toFixed(4)} Ha
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
                        <span className={`gov-status-pill ${badge.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <BadgeIcon size={11} />
                          <span>{language === 'kn' ? badge.textKn : badge.textEn}</span>
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        {app.decisionRemarks ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--color-primary)', fontWeight: 600 }}>
                            {app.decisionRemarks}
                          </div>
                        ) : app.correctionsRequested ? (
                          <div style={{ fontSize: '11.5px', color: 'var(--color-warning)', fontWeight: 600 }}>
                            {app.correctionsRequested}
                          </div>
                        ) : app.operatorRemarks ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {app.operatorRemarks}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Under review</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="gov-table-action-btn"
                          onClick={() => navigate(`/records/${app.id}`)}
                        >
                          <span>{language === 'kn' ? 'ಪೂರ್ಣ ವಿವರ' : 'View Record'}</span>
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

export default CitizenApplicationsPage;
