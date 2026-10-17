import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  AlertTriangle,
  FileText,
  Send,
  X,
  RefreshCw,
  PenTool,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export const ReviewWorkbenchPage = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { role } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fields, setFields] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Load Record & Acquire Lock
  useEffect(() => {
    let isMounted = true;

    const loadRecordData = async () => {
      setLoading(true);
      setError(null);

      if (!recordId) {
        if (isMounted) {
          setError(language === 'en' ? 'Record identifier is missing.' : 'ದಾಖಲೆ ಗುರುತಿನ ಸಂಖ್ಯೆ ಲಭ್ಯವಿಲ್ಲ.');
          setLoading(false);
        }
        return;
      }

      try {
        const res = await apiClient.get(`/records/${recordId}`);
        const backendRecord = res.data?.record;
        if (backendRecord && isMounted) {
          setRecord(backendRecord);
          setRemarks(backendRecord.operatorRemarks || backendRecord.decisionRemarks || '');
          
          // Initialize field edits
          if (Array.isArray(backendRecord.fieldExtractions)) {
            setFields(
              backendRecord.fieldExtractions.map((f) => ({
                id: f.id,
                fieldName: f.fieldName,
                aiValue: f.aiExtractedValue || '',
                verifiedValue: f.humanVerifiedValue || f.aiExtractedValue || '',
                confidence: f.aiConfidence ? Number(f.aiConfidence) : 0.9,
                status: f.status || 'UNVERIFIED',
                correctionReason: f.correctionReason || '',
              }))
            );
          }

          // Lock record in background
          apiClient.post(`/review/${recordId}/lock`).catch(() => {});
        } else {
          throw new Error('Record not found');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load record from database');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRecordData();

    return () => {
      isMounted = false;
      // Release lock on unmount
      if (recordId) {
        apiClient.post(`/review/${recordId}/unlock`).catch(() => {});
      }
    };
  }, [recordId, language]);

  const handleFieldChange = (id, newValue, reason = '') => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              verifiedValue: newValue,
              status: newValue !== f.aiValue ? 'CORRECTED' : 'ACCEPTED',
              correctionReason: reason || f.correctionReason,
            }
          : f
      )
    );
  };

  const handleBackToQueue = () => {
    if (location.state?.from) {
      navigate(location.state.from, { state: location.state });
    } else {
      navigate('/review');
    }
  };

  // Patwari: Submit Operator Review & Field Corrections to Tehsildar
  const handleOperatorSubmit = async () => {
    setIsSubmitting(true);
    setActionError(null);

    const fieldDecisions = fields.map((f) => ({
      fieldId: f.id,
      status: f.verifiedValue !== f.aiValue ? 'CORRECTED' : 'ACCEPTED',
      verifiedValue: f.verifiedValue,
      reason: f.correctionReason || (f.verifiedValue !== f.aiValue ? 'Corrected during field review' : null),
    }));

    try {
      const res = await apiClient.post(`/review/${record.id}/operator-submit`, {
        fieldDecisions,
        operatorRemarks: remarks || 'Operator inspection and field corrections submitted to Tehsildar.',
      });

      if (res.data?.success) {
        setSuccessModal({
          title: language === 'en' ? 'Application Forwarded to Tehsildar' : 'ಅರ್ಜಿಯನ್ನು ತಹಶೀಲ್ದಾರರಿಗೆ ರವಾನಿಸಲಾಗಿದೆ',
          message: language === 'en'
            ? 'Operator review and field corrections have been saved to the database. The case has been placed in the Tehsildar sanction queue.'
            : 'ಕ್ಷೇತ್ರ ತಪಾಸಣೆ ಮತ್ತು ತಿದ್ದುಪಡಿಗಳನ್ನು ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದ್ದು, ತಹಶೀಲ್ದಾರರ ಅನುಮೋದನಾ ಪಟ್ಟಿಗೆ ಸೇರಿಸಲಾಗಿದೆ.',
          auditHash: res.data.auditBlock?.currHash,
        });
      } else {
        throw new Error(res.data?.error || 'Operator submission failed');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tehsildar: Execute Decision (APPROVED, REJECTED, CORRECTIONS_REQUESTED)
  const handleTehsildarDecision = async (decision) => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await apiClient.post(`/review/${record.id}/decision`, {
        decision,
        remarks: remarks || `Application ${decision.toLowerCase()} by Tehsildar.`,
      });

      if (res.data?.success) {
        const titleMap = {
          APPROVED: language === 'en' ? 'Application Sanctioned & Approved' : 'ಹಕ್ಕು ಬದಲಾವಣೆ ಅಧಿಕೃತವಾಗಿ ಅನುಮೋದಿಸಲಾಗಿದೆ',
          REJECTED: language === 'en' ? 'Application Formally Rejected' : 'ಅರ್ಜಿಯನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
          CORRECTIONS_REQUESTED: language === 'en' ? 'Corrections Requested' : 'ತಿದ್ದುಪಡಿಗಳನ್ನು ಕೋರಲಾಗಿದೆ',
        };

        const msgMap = {
          APPROVED: language === 'en'
            ? 'The title record has been officially approved. The decision is now visible to the citizen and recorded on the immutable audit ledger.'
            : 'ದಾಖಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅನುಮೋದಿಸಲಾಗಿದೆ. ನಾಗರಿಕರಿಗೆ ಸ್ಥಿತಿ ಲಭ್ಯವಿದೆ.',
          REJECTED: language === 'en'
            ? 'The application has been rejected with recorded statutory remarks.'
            : 'ಅರ್ಜಿಯನ್ನು ಕಂದಾಯ ನಿಯಮಾವಳಿಗಳಂತೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.',
          CORRECTIONS_REQUESTED: language === 'en'
            ? 'Application returned to the operator/citizen for required corrections.'
            : 'ಅಗತ್ಯ ತಿದ್ದುಪಡಿಗಳಿಗಾಗಿ ಅರ್ಜಿಯನ್ನು ಮರಳಿಸಲಾಗಿದೆ.',
        };

        setSuccessModal({
          title: titleMap[decision] || 'Decision Persisted',
          message: msgMap[decision] || 'Action recorded successfully in the database.',
          auditHash: res.data.auditBlock?.currHash,
        });
      } else {
        throw new Error(res.data?.error || 'Decision failed');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout showBack={true} desktopExpanded={true}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '12px' }}>
          <Loader2 size={32} className="spin" color="var(--color-primary)" />
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {language === 'en' ? 'Loading Document & Extraction Details...' : 'ದಾಖಲೆಯ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...'}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !record) {
    return (
      <AppLayout showBack={true} desktopExpanded={true}>
        <div className="gov-page-container">
          <button onClick={handleBackToQueue} className="gov-table-action-btn" style={{ marginBottom: '16px' }}>
            <ArrowLeft size={14} />
            <span>{language === 'en' ? 'Back to Queue' : 'ಹಿಂದಕ್ಕೆ'}</span>
          </button>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)' }}>
            <AlertTriangle size={18} />
            <span>{error || 'Land record could not be found'}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const documentFileUrl = record.document?.id ? `http://localhost:5000/api/v1/documents/${record.document.id}/file` : null;

  return (
    <AppLayout showBack={true} desktopExpanded={true}>
      <div className="gov-page-container" style={{ paddingBottom: '90px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <button onClick={handleBackToQueue} className="gov-table-action-btn">
            <ArrowLeft size={14} />
            <span>{language === 'en' ? 'Back to Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿಗೆ'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="gov-status-pill status-pill-pending" style={{ fontSize: '11px', fontWeight: 700 }}>
              {record.reviewStatus}
            </span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Ref: {record.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {actionError && (
          <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '13px' }}>
            {actionError}
          </div>
        )}

        {/* Split Screen Workbench Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {/* Left Column: Original Uploaded Document Viewer */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {language === 'en' ? 'Original Document Scan' : 'ಮೂಲ ಕಡತದ ನಕಲು'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {record.document?.originalFilename || 'Deed Scan'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="toggle-btn" onClick={() => setZoomLevel((z) => Math.max(60, z - 20))} title="Zoom Out">
                  <ZoomOut size={13} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>{zoomLevel}%</span>
                <button className="toggle-btn" onClick={() => setZoomLevel((z) => Math.min(240, z + 20))} title="Zoom In">
                  <ZoomIn size={13} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', overflow: 'auto', maxHeight: '560px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', padding: '12px' }}>
              {documentFileUrl ? (
                <img
                  src={documentFileUrl}
                  alt="Original Document"
                  style={{
                    maxWidth: `${zoomLevel}%`,
                    height: 'auto',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    borderRadius: 'var(--radius-xs)',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    document.getElementById('doc-fallback').style.display = 'block';
                  }}
                />
              ) : null}
              <div id="doc-fallback" style={{ display: documentFileUrl ? 'none' : 'block', padding: '32px 16px', color: 'var(--text-muted)' }}>
                <FileText size={32} style={{ margin: '0 auto 8px' }} />
                <div>{record.document?.originalFilename || 'Document scan available in repository'}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Fields & Officer Adjudication */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                {language === 'en' ? 'Extracted Land Revenue Fields' : 'ಹೊರತೆಗೆಯಲಾದ ಕಂದಾಯ ವಿವರಗಳು'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {role === 'PATWARI'
                  ? (language === 'en' ? 'Inspect and correct extracted fields against the document.' : 'ದಾಖಲೆಯೊಂದಿಗೆ ಕ್ಷೇತ್ರಗಳನ್ನು ತಾಳೆ ನೋಡಿ ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ತಿದ್ದಿ.')
                  : (language === 'en' ? 'Review extracted fields and Patwari corrections before statutory decision.' : 'ಅಂತಿಮ ಆದೇಶ ನೀಡುವ ಮುನ್ನ ಪಟ್ವಾರಿ ತಿದ್ದುಪಡಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.')}
              </div>
            </div>

            {/* Field Extractions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fields.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px', textAlign: 'center' }}>
                  {language === 'en' ? 'No field extractions recorded for this document.' : 'ವಿವರಗಳು ಲಭ್ಯವಿಲ್ಲ.'}
                </div>
              ) : (
                fields.map((f) => (
                  <div key={f.id} style={{ padding: '10px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {f.fieldName.replace(/_/g, ' ')}
                      </span>
                      <span className="gov-status-pill status-pill-verified" style={{ fontSize: '9.5px' }}>
                        OCR: {(f.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    {role === 'PATWARI' ? (
                      <div>
                        <input
                          type="text"
                          value={f.verifiedValue}
                          onChange={(e) => handleFieldChange(f.id, e.target.value)}
                          className="gis-search-input"
                          style={{ width: '100%', fontSize: '12.5px', padding: '6px 8px' }}
                        />
                        {f.verifiedValue !== f.aiValue && (
                          <div style={{ fontSize: '10.5px', color: 'var(--color-primary)', marginTop: '2px' }}>
                            Original OCR: {f.aiValue}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {f.verifiedValue || f.aiValue || '—'}
                        {f.verifiedValue !== f.aiValue && (
                          <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginLeft: '6px' }}>
                            (Patwari corrected from: {f.aiValue})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Operator Remarks Display (for Tehsildar) */}
            {role === 'TEHSILDAR' && record.operatorRemarks && (
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid var(--color-primary)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {language === 'en' ? 'Patwari Field Inspection Remarks:' : 'ಪಟ್ವಾರಿ ಸ್ಥಳ ತಪಾಸಣಾ ಷರಾ:'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--text-primary)' }}>
                  {record.operatorRemarks}
                </div>
              </div>
            )}

            {/* Officer Remarks Input */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {role === 'PATWARI'
                  ? (language === 'en' ? 'Patwari Remarks / Inspection Report' : 'ಪಟ್ವಾರಿ ತಪಾಸಣಾ ಷರಾ')
                  : (language === 'en' ? 'Tehsildar Decision Remarks / Statutory Order' : 'ತಹಶೀಲ್ದಾರ್ ಆದೇಶ ಷರಾ')}
              </label>
              <textarea
                rows={3}
                className="gis-search-input"
                style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '8px' }}
                placeholder={
                  role === 'PATWARI'
                    ? (language === 'en' ? 'Enter field survey inspection notes and recommendations for Tehsildar...' : 'ತಹಶೀಲ್ದಾರರಿಗೆ ಸಲ್ಲಿಸಲು ತಪಾಸಣಾ ಟಿಪ್ಪಣಿ ಬರೆಯಿರಿ...')
                    : (language === 'en' ? 'Enter statutory verification sanction remarks...' : 'ಅನುಮೋದನೆ ಅಥವಾ ತಿರಸ್ಕಾರದ ಅಧಿಕೃತ ಆದೇಶ ಷರಾ ನಮೂದಿಸಿ...')
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky-action-footer">
          {role === 'PATWARI' ? (
            <button
              className="btn-approve"
              style={{ padding: '10px 20px', fontSize: '13px', backgroundColor: 'var(--color-primary)' }}
              onClick={handleOperatorSubmit}
              disabled={isSubmitting}
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Submitting...' : (language === 'en' ? 'Submit to Tehsildar' : 'ತಹಶೀಲ್ದಾರರಿಗೆ ರವಾನಿಸಿ')}</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-reject"
                style={{ padding: '10px 18px', fontSize: '12.5px' }}
                onClick={() => handleTehsildarDecision('REJECTED')}
                disabled={isSubmitting}
              >
                <X size={14} />
                <span>{language === 'en' ? 'Reject Application' : 'ತಿರಸ್ಕರಿಸಿ'}</span>
              </button>
              <button
                className="btn-resurvey"
                style={{ padding: '10px 18px', fontSize: '12.5px' }}
                onClick={() => handleTehsildarDecision('CORRECTIONS_REQUESTED')}
                disabled={isSubmitting}
              >
                <RefreshCw size={13} />
                <span>{language === 'en' ? 'Request Corrections' : 'ತಿದ್ದುಪಡಿ ಕೋರಿ'}</span>
              </button>
              <button
                className="btn-approve"
                style={{ padding: '10px 22px', fontSize: '13px' }}
                onClick={() => handleTehsildarDecision('APPROVED')}
                disabled={isSubmitting}
              >
                <PenTool size={14} />
                <span>{isSubmitting ? 'Signing...' : (language === 'en' ? 'Sign & Approve' : 'ದೃಢೀಕರಿಸಿ ಅನುಮೋದಿಸಿ')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Real Success Modal */}
        {successModal && (
          <Modal
            isOpen={true}
            onClose={() => { setSuccessModal(null); navigate('/review'); }}
            title={successModal.title}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 700, fontSize: '14px' }}>
                <CheckCircle2 size={20} />
                <span>{successModal.title}</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                {successModal.message}
              </p>

              {successModal.auditHash && (
                <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '11px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2px' }}>
                    SHA-256 Ledger Audit Block:
                  </div>
                  <div className="font-mono" style={{ wordBreak: 'break-all', color: 'var(--color-primary)' }}>
                    {successModal.auditHash}
                  </div>
                </div>
              )}

              <button
                className="btn-approve"
                style={{ marginTop: '8px', padding: '9px 16px', fontSize: '12px', justifyContent: 'center' }}
                onClick={() => { setSuccessModal(null); navigate('/review'); }}
              >
                <span>{language === 'en' ? 'Return to Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ'}</span>
              </button>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
};

export default ReviewWorkbenchPage;
