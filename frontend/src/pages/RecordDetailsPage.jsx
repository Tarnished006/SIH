import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { 
  Building, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Users, 
  ArrowLeft,
  Download,
  AlertCircle,
  Clock,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export const RecordDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { role } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/records/${id}`);
        if (res.data?.success && res.data.record) {
          setRecord(res.data.record);
        } else {
          throw new Error('Record not found');
        }
      } catch (err) {
        console.error('[FETCH_RECORD_DETAIL_ERR]', err);
        setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Error loading land record');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecord();
    }
  }, [id]);

  if (loading) {
    return (
      <AppLayout showBack={true} desktopExpanded={true}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px' }}>
          <Loader2 size={32} className="spin" color="var(--color-primary)" />
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {language === 'kn' ? 'ದಾಖಲೆ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading land record details from database...'}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !record) {
    return (
      <AppLayout showBack={true} desktopExpanded={true}>
        <div className="gov-page-container">
          <button
            onClick={() => navigate(-1)}
            className="gov-table-action-btn"
            style={{ marginBottom: '16px' }}
          >
            <ArrowLeft size={14} />
            <span>{language === 'kn' ? 'ಹಿಂದಕ್ಕೆ' : 'Go Back'}</span>
          </button>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <div>
              <div style={{ fontWeight: 700 }}>Access Notice</div>
              <div style={{ fontSize: '12.5px' }}>{error || 'Unable to retrieve land record.'}</div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const documentFileUrl = record.document?.id ? `http://localhost:5000/api/v1/documents/${record.document.id}/file` : null;

  return (
    <AppLayout showBack={true} title={`Survey No. ${record.surveyNumber}`} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '14px' }}>
          <button
            onClick={() => navigate(role === 'CITIZEN' ? '/applications' : '/records')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
            }}
          >
            <ArrowLeft size={14} />
            <span>{role === 'CITIZEN' ? (language === 'kn' ? 'ನನ್ನ ಅರ್ಜಿಗಳಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to My Applications') : (language === 'kn' ? 'ದಾಖಲೆಗಳ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Land Records')}</span>
          </button>
        </div>

        {/* Record Overview Header */}
        <div className="gov-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 className="gov-page-title">
                {language === 'kn' ? `ಸರ್ವೆ ನಂ: ${record.surveyNumber}` : `Survey No. ${record.surveyNumber}`}
              </h1>
              <span className="gov-status-pill status-pill-verified">
                {record.reviewStatus}
              </span>
            </div>
            <p className="gov-page-subtitle">
              {record.villageName || 'Karnataka'} • LGD: {record.villageLgd || '29'} • Application Ref: {record.applicationNo || record.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          {documentFileUrl && (
            <a
              href={documentFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gov-table-action-btn primary"
              style={{ textDecoration: 'none', padding: '8px 14px', fontSize: '12px' }}
            >
              <Download size={14} />
              <span>{language === 'kn' ? 'ಮೂಲ ಕಡತ ಡೌನ್‌ಲೋಡ್' : 'Download Original Deed'}</span>
            </a>
          )}
        </div>

        {/* Two-Column Grid: Details and Extractions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {/* Card 1: Official Land & Verification Information */}
          <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
              {language === 'kn' ? 'ಕಂದಾಯ ವಿವರಗಳು ಮತ್ತು ಅಧಿಕಾರಿ ಆದೇಶ' : 'Revenue Title & Adjudication'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Survey Number</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>Sy. {record.surveyNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bhu-Aadhaar (ULPIN)</div>
                <div className="font-mono" style={{ fontSize: '12px', fontWeight: 600 }}>{record.ulpin || 'PROVISIONAL'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stated Extent / Area</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{record.rawArea ? `${record.rawArea} ${record.rawUnit || 'Acre'}` : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Metric Extent</div>
                <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                  {record.normalizedAreaHectares ? `${Number(record.normalizedAreaHectares).toFixed(4)} Hectares` : '—'}
                </div>
              </div>
            </div>

            {/* Officer Remarks & Decision Block */}
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                <ShieldCheck size={14} color="var(--color-primary)" />
                <span>{language === 'kn' ? 'ಅಧಿಕೃತ ಆದೇಶ ವಿವರಗಳು' : 'Statutory Verification Record'}</span>
              </div>

              {record.decisionRemarks && (
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-primary)' }}>Tehsildar Decision Remarks:</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{record.decisionRemarks}</div>
                  {record.verifiedBy && (
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Verified by: {record.verifiedBy.name} ({record.verifiedBy.role}) on {new Date(record.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {record.correctionsRequested && (
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--color-warning)' }}>Corrections Requested:</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{record.correctionsRequested}</div>
                </div>
              )}

              {record.operatorRemarks && (
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>Patwari Inspection Remarks:</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.operatorRemarks}</div>
                </div>
              )}

              {!record.decisionRemarks && !record.operatorRemarks && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Application currently in queue awaiting officer inspection.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: AI OCR Extracted Fields & Confidence */}
          <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '13.5px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
              {language === 'kn' ? 'ಎಐ ಹೊರತೆಗೆದ ಕ್ಷೇತ್ರಗಳು ಮತ್ತು ನಿಖರತೆ' : 'AI Extracted Fields & Confidence'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {record.fieldExtractions && record.fieldExtractions.length > 0 ? (
                record.fieldExtractions.map((f) => {
                  const conf = f.aiConfidence ? (Number(f.aiConfidence) * 100).toFixed(1) : '95.0';
                  return (
                    <div key={f.id} style={{ padding: '10px 12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                          {f.fieldName.replace(/_/g, ' ')}
                        </span>
                        <span className="gov-status-pill status-pill-verified" style={{ fontSize: '9.5px' }}>
                          Confidence: {conf}%
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {f.humanVerifiedValue || f.aiExtractedValue || '—'}
                      </div>
                      {f.humanVerifiedValue && f.humanVerifiedValue !== f.aiExtractedValue && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-primary)', marginTop: '2px' }}>
                          Corrected by Operator (Original: {f.aiExtractedValue})
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No field-level extractions recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RecordDetailsPage;
