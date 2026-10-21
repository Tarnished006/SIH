import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import Modal from '../components/common/Modal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  AlertTriangle,
  FileText,
  Send,
  X,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Edit3,
  Check,
  Eye,
  AlertCircle
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
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'FLAGGED'
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imageBlobUrl, setImageBlobUrl] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Re-scan Request Modal State
  const [showRescanModal, setShowRescanModal] = useState(false);
  const [rescanReason, setRescanReason] = useState('BLURRY_IMAGE');
  const [rescanCustomNotes, setRescanCustomNotes] = useState('');

  // Default coordinate layout fallback for documents without exact bounding boxes
  const getFieldDefaultBox = (fieldName, index, total) => {
    const known = {
      survey_number: { top: 16, left: 12, width: 36, height: 9 },
      owner_name: { top: 29, left: 12, width: 56, height: 10 },
      raw_area: { top: 43, left: 12, width: 44, height: 9 },
      village: { top: 57, left: 12, width: 40, height: 9 },
      khata_number: { top: 71, left: 12, width: 34, height: 8 },
    };
    if (known[fieldName]) return known[fieldName];
    const top = 16 + Math.min(index * 13, 70);
    return { top, left: 14, width: 48, height: 8 };
  };

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

          if (backendRecord.document?.id) {
            apiClient.get(`/documents/${backendRecord.document.id}/file`, { responseType: 'blob' })
              .then((blobRes) => {
                if (isMounted && blobRes.data) {
                  setImageBlobUrl(URL.createObjectURL(blobRes.data));
                }
              })
              .catch(() => {});
          }
          
          if (Array.isArray(backendRecord.fieldExtractions) && backendRecord.fieldExtractions.length > 0) {
            const mapped = backendRecord.fieldExtractions.map((f, idx) => ({
              id: f.id,
              fieldName: f.fieldName,
              aiValue: f.aiExtractedValue || '',
              verifiedValue: f.humanVerifiedValue || f.aiExtractedValue || '',
              confidence: f.aiConfidence ? Number(f.aiConfidence) : 0.92,
              status: f.status || 'UNVERIFIED',
              correctionReason: f.correctionReason || '',
              boundingBox: f.boundingBox || getFieldDefaultBox(f.fieldName, idx, backendRecord.fieldExtractions.length),
              ruleValidationStatus: f.ruleValidationStatus || 'PASS',
              ruleValidationMessage: f.ruleValidationMessage || null,
            }));
            setFields(mapped);
            if (mapped.length > 0) {
              setActiveFieldId(mapped[0].id);
            }
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

  const handleAcceptAiValue = (id) => {
    setFields((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              verifiedValue: f.aiValue,
              status: 'ACCEPTED',
              correctionReason: '',
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
      reason: f.correctionReason || (f.verifiedValue !== f.aiValue ? 'Verified against original document scan' : null),
    }));

    try {
      const res = await apiClient.post(`/review/${record.id}/operator-submit`, {
        fieldDecisions,
        operatorRemarks: remarks || 'Operator inspection and field corrections submitted to Tehsildar.',
        action: 'SUBMIT_TO_TEHSILDAR',
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

  // Patwari or Tehsildar: Request Re-scan for Dull/Illegible Scans
  const handleExecuteRescanRequest = async () => {
    setIsSubmitting(true);
    setActionError(null);

    const reasonDescriptions = {
      BLURRY_IMAGE: 'Uploaded image is blurry or out of focus.',
      DARK_PHOTO: 'Photograph is dark or low contrast, making script illegible.',
      CROPPED_DATA: 'Document edges or critical revenue identifiers are cut off.',
      FADED_INK: 'Original ink is severely faded or smudged.',
      OTHER: rescanCustomNotes || 'Document scan is unreadable.',
    };

    const combinedNotice = `${reasonDescriptions[rescanReason] || 'Clearer scan required.'} ${rescanCustomNotes ? `Officer remarks: ${rescanCustomNotes}` : ''}`.trim();

    try {
      if (role === 'PATWARI') {
        const res = await apiClient.post(`/review/${record.id}/operator-submit`, {
          fieldDecisions: [],
          operatorRemarks: combinedNotice,
          action: 'REQUEST_RESCAN',
        });
        if (res.data?.success) {
          setShowRescanModal(false);
          setSuccessModal({
            title: language === 'en' ? 'Re-scan Notice Issued to Citizen' : 'ಮರು-ಸ್ಕ್ಯಾನ್ ಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ',
            message: language === 'en'
              ? 'Application has been returned to the citizen with instructions to upload a clearer, well-lit document.'
              : 'ಸ್ಪಷ್ಟವಾದ ದಾಖಲೆಯನ್ನು ಮರು-ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ನಾಗರಿಕರಿಗೆ ಸೂಚನೆ ನೀಡಲಾಗಿದೆ.',
            auditHash: res.data.auditBlock?.currHash,
          });
        } else {
          throw new Error(res.data?.error || 'Failed to issue re-scan request');
        }
      } else {
        // Tehsildar
        const res = await apiClient.post(`/review/${record.id}/decision`, {
          decision: 'CORRECTIONS_REQUESTED',
          remarks: combinedNotice,
        });
        if (res.data?.success) {
          setShowRescanModal(false);
          setSuccessModal({
            title: language === 'en' ? 'Application Returned for Re-scan' : 'ಮರು-ಸ್ಕ್ಯಾನ್‌ಗಾಗಿ ಅರ್ಜಿಯನ್ನು ಮರಳಿಸಲಾಗಿದೆ',
            message: language === 'en'
              ? 'Statutory notice recorded. Citizen must upload a clearer document before approval.'
              : 'ಅಧಿಕೃತ ಆದೇಶ ದಾಖಲಾಗಿದೆ. ನಾಗರಿಕರು ಸ್ಪಷ್ಟ ದಾಖಲೆ ಮರು-ಸಲ್ಲಿಸಬೇಕು.',
            auditHash: res.data.auditBlock?.currHash,
          });
        } else {
          throw new Error(res.data?.error || 'Failed to issue re-scan request');
        }
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.response?.data?.error || err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tehsildar: Execute Decision (APPROVED, REJECTED)
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
        };

        const msgMap = {
          APPROVED: language === 'en'
            ? 'The title record has been officially approved. The decision is now visible to the citizen and recorded on the immutable audit trail.'
            : 'ದಾಖಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅನುಮೋದಿಸಲಾಗಿದೆ. ನಾಗರಿಕರಿಗೆ ಸ್ಥಿತಿ ಲಭ್ಯವಿದೆ.',
          REJECTED: language === 'en'
            ? 'The application has been rejected with recorded statutory remarks.'
            : 'ಅರ್ಜಿಯನ್ನು ಕಂದಾಯ ನಿಯಮಾವಳಿಗಳಂತೆ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.',
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
          <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <span>{error || 'Land record could not be found'}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const documentFileUrl = record.document?.id ? `http://localhost:5000/api/v1/documents/${record.document.id}/file` : null;

  // Triage counters
  const totalCount = fields.length;
  const flaggedCount = fields.filter((f) => f.confidence < 0.85 || f.ruleValidationStatus !== 'PASS').length;
  const verifiedCount = fields.filter((f) => f.confidence >= 0.85 && f.ruleValidationStatus === 'PASS').length;
  const correctedCount = fields.filter((f) => f.verifiedValue !== f.aiValue).length;

  const displayedFields = filterMode === 'FLAGGED'
    ? fields.filter((f) => f.confidence < 0.85 || f.ruleValidationStatus !== 'PASS' || f.verifiedValue !== f.aiValue)
    : fields;

  const formatFieldName = (name) => {
    switch (name) {
      case 'survey_number':
        return language === 'en' ? 'Survey / Khasra No.' : 'ಸರ್ವೆ / ಖಸ್ರಾ ನಂಬರ್';
      case 'owner_name':
        return language === 'en' ? 'Landholder Name' : 'ಖಾತೆದಾರರ ಹೆಸರು';
      case 'raw_area':
        return language === 'en' ? 'Land Extent / Area' : 'ವಿಸ್ತೀರ್ಣ (ವ್ಯಾಪ್ತಿ)';
      case 'village':
        return language === 'en' ? 'Revenue Village' : 'ಕಂದಾಯ ಗ್ರಾಮ';
      case 'khata_number':
        return language === 'en' ? 'Khata Number' : 'ಖಾತೆ ಸಂಖ್ಯೆ';
      case 'subdivision_number':
        return language === 'en' ? 'Subdivision / Hissa' : 'ಹಿಸ್ಸಾ ನಂಬರ್';
      default:
        return name.replace(/_/g, ' ');
    }
  };

  return (
    <AppLayout showBack={true} desktopExpanded={true}>
      <div className="gov-page-container" style={{ paddingBottom: '90px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleBackToQueue} className="gov-table-action-btn">
              <ArrowLeft size={14} />
              <span>{language === 'en' ? 'Back to Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿಗೆ'}</span>
            </button>

            {/* Quick Action in Top Header: Request Re-scan for Dull/Illegible Document */}
            <button
              onClick={() => setShowRescanModal(true)}
              className="gov-table-action-btn"
              style={{ backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d', fontWeight: 600 }}
              title="Request citizen to re-upload clearer scan if unreadable"
            >
              <RotateCcw size={13} />
              <span>{language === 'en' ? 'Request Re-scan' : 'ಮರು-ಸ್ಕ್ಯಾನ್ ಕೋರಿಕೆ'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="gov-status-pill status-pill-pending" style={{ fontSize: '11px', fontWeight: 700 }}>
              {record.reviewStatus.replace(/_/g, ' ')}
            </span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Ref: {record.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {actionError && (
          <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* HITL Triage Overview Banner */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '10px 16px', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {language === 'en' ? 'Human-in-the-Loop Verification' : 'ಮಾನವ-ತಾಂತ್ರಿಕ ಪರಿಶೀಲನೆ'}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="gov-status-pill status-pill-verified" style={{ fontSize: '10px' }}>
                <CheckCircle2 size={11} style={{ marginRight: '3px' }} />
                {verifiedCount} {language === 'en' ? 'Verified' : 'ದೃಢೀಕೃತ'}
              </span>
              {flaggedCount > 0 && (
                <span className="gov-status-pill status-pill-flagged" style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                  <AlertTriangle size={11} style={{ marginRight: '3px' }} />
                  {flaggedCount} {language === 'en' ? 'Flagged for Inspection' : 'ಪರಿಶೀಲನೆ ಅಗತ್ಯ'}
                </span>
              )}
              {correctedCount > 0 && (
                <span className="gov-status-pill" style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}>
                  <Edit3 size={11} style={{ marginRight: '3px' }} />
                  {correctedCount} {language === 'en' ? 'Human Corrected' : 'ತಿದ್ದಿದ ವಿವರ'}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className="toggle-btn"
              onClick={() => setFilterMode('ALL')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                backgroundColor: filterMode === 'ALL' ? 'var(--color-primary)' : 'transparent',
                color: filterMode === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: filterMode === 'ALL' ? 700 : 500,
              }}
            >
              {language === 'en' ? `All Fields (${totalCount})` : `ಎಲ್ಲ ವಿವರಗಳು (${totalCount})`}
            </button>
            <button
              className="toggle-btn"
              onClick={() => setFilterMode('FLAGGED')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                backgroundColor: filterMode === 'FLAGGED' ? '#dc2626' : 'transparent',
                color: filterMode === 'FLAGGED' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: filterMode === 'FLAGGED' ? 700 : 500,
              }}
            >
              {language === 'en' ? `Flagged Only (${flaggedCount})` : `ಅನುಮಾನಾಸ್ಪದ ಮಾತ್ರ (${flaggedCount})`}
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.1fr) minmax(420px, 1fr)', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Column: Original Document Scan with Interactive Bounding Boxes */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="var(--color-primary)" />
                  <span>{language === 'en' ? 'Original Document Scan' : 'ಮೂಲ ಕಡತದ ನಕಲು'}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {record.document?.originalFilename || 'Deed Scan'} • {language === 'en' ? 'Click bounding boxes to inspect' : 'ಪರಿಶೀಲಿಸಲು ಬಾಕ್ಸ್‌ಗಳ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ'}
                </div>
              </div>

              {/* Zoom & Reset Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="toggle-btn" onClick={() => setZoomLevel((z) => Math.max(60, z - 20))} title="Zoom Out">
                  <ZoomOut size={13} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, minWidth: '36px', textAlign: 'center' }}>{zoomLevel}%</span>
                <button className="toggle-btn" onClick={() => setZoomLevel((z) => Math.min(240, z + 20))} title="Zoom In">
                  <ZoomIn size={13} />
                </button>
                <button 
                  className="toggle-btn" 
                  onClick={() => setRotation((r) => (r + 90) % 360)} 
                  title="Rotate Document 90° Clockwise"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RotateCw size={13} />
                  <span style={{ fontSize: '10px' }}>{rotation !== 0 ? `${rotation}°` : 'Rotate'}</span>
                </button>
                <button className="toggle-btn" onClick={() => { setZoomLevel(100); setRotation(0); }} title="Reset View">
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Document Image & Highlighting Container */}
            <div 
              style={{ 
                overflow: 'auto', 
                maxHeight: '620px', 
                backgroundColor: 'var(--bg-subtle)', 
                borderRadius: 'var(--radius-xs)', 
                padding: '16px',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: `${zoomLevel}%`, margin: '0 auto' }}>
                {(imageBlobUrl || documentFileUrl) && !imageLoadError ? (
                  <img
                    src={imageBlobUrl || documentFileUrl}
                    alt={record.document?.originalFilename || "Original Document"}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      borderRadius: "var(--radius-xs)",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                      transform: rotation ? `rotate(${rotation}deg)` : "none",
                      transition: "transform 0.2s ease",
                    }}
                    onError={() => {
                      console.error("Failed to load image via direct URL");
                      setImageLoadError(true);
                    }}
                  />
                ) : imageLoadError ? (
                  <div style={{ width: "460px", minHeight: "240px", backgroundColor: "#ffffff", border: "1px dashed #d1d5db", borderRadius: "var(--radius-xs)", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                    <AlertTriangle size={32} color="#f59e0b" />
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>{record.document?.originalFilename || "Pahani Scan"}</div>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Unable to embed image inline.</p>
                    {documentFileUrl && (
                      <a href={documentFileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: "12px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <FileText size={14} /> Open Original Document File
                      </a>
                    )}
                  </div>
                ) : null}

                {/* Visual Bounding Box Highlights Over Document */}
                {fields.map((f) => {
                  const box = f.boundingBox || getFieldDefaultBox(f.fieldName, 0, fields.length);
                  const isFlagged = f.confidence < 0.85 || f.ruleValidationStatus !== 'PASS';
                  const isCorrected = f.verifiedValue !== f.aiValue;
                  const isActive = activeFieldId === f.id;

                  let borderColor = '#059669'; // Emerald
                  let bgColor = 'rgba(5, 150, 105, 0.12)';
                  let badgeText = `${(f.confidence * 100).toFixed(0)}%`;
                  let BadgeIcon = CheckCircle2;

                  if (isCorrected) {
                    borderColor = '#d97706'; // Amber
                    bgColor = 'rgba(217, 119, 6, 0.16)';
                    badgeText = 'Corrected';
                    BadgeIcon = Edit3;
                  } else if (isFlagged) {
                    borderColor = '#dc2626'; // Red
                    bgColor = 'rgba(220, 38, 38, 0.18)';
                    badgeText = 'Review';
                    BadgeIcon = AlertTriangle;
                  }

                  return (
                    <div
                      key={f.id}
                      onClick={() => setActiveFieldId(f.id)}
                      style={{
                        position: 'absolute',
                        top: `${box.top}%`,
                        left: `${box.left}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                        border: `2px solid ${borderColor}`,
                        backgroundColor: isActive ? bgColor.replace('0.1', '0.28').replace('0.16', '0.32').replace('0.18', '0.35') : bgColor,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.65)' : 'none',
                        transition: 'all 0.15s ease',
                        zIndex: isActive ? 10 : 2,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'flex-end',
                        padding: '2px 4px',
                      }}
                      title={`${f.fieldName}: ${f.verifiedValue || f.aiValue} (${(f.confidence * 100).toFixed(1)}% confidence)`}
                    >
                      <span 
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          backgroundColor: borderColor,
                          color: '#ffffff',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          lineHeight: 1.2
                        }}
                      >
                        <BadgeIcon size={9} />
                        <span>{badgeText}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Legend */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#059669', display: 'inline-block' }} />
                <span>{language === 'en' ? 'Verified (≥85%)' : 'ದೃಢೀಕೃತ'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#dc2626', display: 'inline-block' }} />
                <span>{language === 'en' ? 'Needs Inspection (<85%)' : 'ಪರಿಶೀಲನೆ ಅಗತ್ಯ'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#d97706', display: 'inline-block' }} />
                <span>{language === 'en' ? 'Human Corrected' : 'ತಿದ್ದಿದ ವಿವರ'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Land Revenue Fields & HITL Verification */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                {language === 'en' ? 'Extracted Land Revenue Fields' : 'ಹೊರತೆಗೆಯಲಾದ ಕಂದಾಯ ವಿವರಗಳು'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {role === 'PATWARI'
                  ? (language === 'en' ? 'Compare highlighted lines on scan. Edit any discrepancies before forwarding.' : 'ಎಡಭಾಗದ ನಕಲನ್ನು ತಾಳೆ ನೋಡಿ. ವ್ಯತ್ಯಾಸವಿದ್ದರೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ.')
                  : (language === 'en' ? 'Review Patwari corrections against document scan before statutory sanction.' : 'ಅಂತಿಮ ಆದೇಶ ನೀಡುವ ಮುನ್ನ ಪಟ್ವಾರಿ ತಿದ್ದುಪಡಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.')}
              </div>
            </div>

            {/* Field Extractions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '490px', overflowY: 'auto', paddingRight: '4px' }}>
              {displayedFields.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '24px', textAlign: 'center' }}>
                  {language === 'en' ? 'No fields matching current filter.' : 'ವಿವರಗಳು ಲಭ್ಯವಿಲ್ಲ.'}
                </div>
              ) : (
                displayedFields.map((f) => {
                  const isFlagged = f.confidence < 0.85 || f.ruleValidationStatus !== 'PASS';
                  const isCorrected = f.verifiedValue !== f.aiValue;
                  const isActive = activeFieldId === f.id;

                  return (
                    <div 
                      key={f.id} 
                      onClick={() => setActiveFieldId(f.id)}
                      style={{ 
                        padding: '12px', 
                        border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--border-subtle)', 
                        borderRadius: 'var(--radius-xs)', 
                        backgroundColor: isActive ? 'var(--bg-subtle)' : 'var(--bg-card)',
                        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Field Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatFieldName(f.fieldName)}
                        </span>

                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {isCorrected ? (
                            <span className="gov-status-pill" style={{ fontSize: '9.5px', backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}>
                              <Edit3 size={10} style={{ marginRight: '3px' }} />
                              {language === 'en' ? 'Human Corrected' : 'ತಿದ್ದಿದ ವಿವರ'}
                            </span>
                          ) : isFlagged ? (
                            <span className="gov-status-pill status-pill-flagged" style={{ fontSize: '9.5px', backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}>
                              <AlertTriangle size={10} style={{ marginRight: '3px' }} />
                              {(f.confidence * 100).toFixed(0)}% {language === 'en' ? 'Low Conf' : 'ಕಡಿಮೆ ವಿಶ್ವಾಸ'}
                            </span>
                          ) : (
                            <span className="gov-status-pill status-pill-verified" style={{ fontSize: '9.5px' }}>
                              <CheckCircle2 size={10} style={{ marginRight: '3px' }} />
                              {(f.confidence * 100).toFixed(0)}% {language === 'en' ? 'High Conf' : 'ದೃಢೀಕೃತ'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Field Edit Input / Diff Display */}
                      {role === 'PATWARI' ? (
                        <div>
                          <input
                            type="text"
                            value={f.verifiedValue}
                            onChange={(e) => handleFieldChange(f.id, e.target.value)}
                            className="gis-search-input"
                            style={{ 
                              width: '100%', 
                              fontSize: '12.5px', 
                              padding: '7px 9px',
                              borderColor: isCorrected ? '#d97706' : (isFlagged ? '#dc2626' : 'var(--border-subtle)')
                            }}
                          />
                          
                          {/* Live Diff Tag if value was modified */}
                          {isCorrected && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '10.5px' }}>
                              <span style={{ color: '#b45309' }}>
                                <strong>Original AI:</strong> {f.aiValue}
                              </span>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); handleAcceptAiValue(f.id); }}
                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                              >
                                {language === 'en' ? 'Reset to AI' : 'ಮೂಲಕ್ಕೆ ಮರುಹೊಂದಿಸಿ'}
                              </button>
                            </div>
                          )}

                          {isFlagged && !isCorrected && (
                            <div style={{ fontSize: '10.5px', color: '#dc2626', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={11} />
                              <span>{language === 'en' ? 'Low confidence extraction. Verify against highlighted line.' : 'ಅನುಮಾನಾಸ್ಪದ ಅಕ್ಷರ. ಮೂಲ ನಕಲಿನೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.'}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {f.verifiedValue || f.aiValue || '—'}
                          </div>
                          {isCorrected && (
                            <div style={{ fontSize: '11px', color: '#b45309', marginTop: '3px' }}>
                              Patwari corrected from original AI: <em>{f.aiValue}</em>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Officer Inspection Remarks Input */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {role === 'PATWARI'
                  ? (language === 'en' ? 'Patwari Field Survey & Inspection Remarks' : 'ಪಟ್ವಾರಿ ಸ್ಥಳ ತಪಾಸಣಾ ಷರಾ')
                  : (language === 'en' ? 'Tehsildar Decision Remarks / Statutory Order' : 'ತಹಶೀಲ್ದಾರ್ ಅಧಿಕೃತ ಆದೇಶ ಷರಾ')}
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Dull/Illegible Document Action */}
              <button
                className="btn-resurvey"
                style={{ padding: '10px 18px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowRescanModal(true)}
                disabled={isSubmitting}
              >
                <RotateCcw size={13} />
                <span>{language === 'en' ? 'Request Re-scan' : 'ಮರು-ಸ್ಕ್ಯಾನ್ ಕೋರಿಕೆ'}</span>
              </button>

              {/* Forward to Tehsildar */}
              <button
                className="btn-approve"
                style={{ padding: '10px 22px', fontSize: '13px', backgroundColor: 'var(--color-primary)' }}
                onClick={handleOperatorSubmit}
                disabled={isSubmitting}
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Submitting...' : (language === 'en' ? 'Forward to Tehsildar' : 'ತಹಶೀಲ್ದಾರರಿಗೆ ರವಾನಿಸಿ')}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                onClick={() => setShowRescanModal(true)}
                disabled={isSubmitting}
              >
                <RotateCcw size={13} />
                <span>{language === 'en' ? 'Request Re-scan' : 'ಮರು-ಸ್ಕ್ಯಾನ್ ಕೋರಿಕೆ'}</span>
              </button>

              <button
                className="btn-approve"
                style={{ padding: '10px 22px', fontSize: '13px', backgroundColor: '#059669' }}
                onClick={() => handleTehsildarDecision('APPROVED')}
                disabled={isSubmitting}
              >
                <Check size={14} />
                <span>{isSubmitting ? 'Sanctioning...' : (language === 'en' ? 'Sanction & Approve' : 'ದೃಢೀಕರಿಸಿ ಅನುಮೋದಿಸಿ')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal: Request Re-scan for Dull/Illegible Scans */}
        {showRescanModal && (
          <Modal
            isOpen={true}
            onClose={() => setShowRescanModal(false)}
            title={language === 'en' ? 'Request Clearer Document Re-scan' : 'ಸ್ಪಷ್ಟ ದಾಖಲೆಗಾಗಿ ಮರು-ಸ್ಕ್ಯಾನ್ ಕೋರಿಕೆ'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {language === 'en'
                  ? 'If the uploaded document is dark, blurry, folded, or has illegible handwriting, return it to the citizen for a clearer re-upload.'
                  : 'ದಾಖಲೆಯು ಮಸುಕಾಗಿದ್ದರೆ ಅಥವಾ ಓದಲಾಗದಿದ್ದರೆ, ಸ್ಪಷ್ಟ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ನಾಗರಿಕರಿಗೆ ಸೂಚಿಸಿ.'}
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                  {language === 'en' ? 'Primary Issue Identified' : 'ಪ್ರಮುಖ ಕೊರತೆ'}
                </label>
                <select
                  className="gis-search-input"
                  style={{ width: '100%', fontSize: '12px', padding: '7px 9px' }}
                  value={rescanReason}
                  onChange={(e) => setRescanReason(e.target.value)}
                >
                  <option value="BLURRY_IMAGE">{language === 'en' ? 'Image is blurry or camera out of focus' : 'ಚಿತ್ರವು ಮಸುಕಾಗಿದೆ / ಫೋಕಸ್ ಇಲ್ಲ'}</option>
                  <option value="DARK_PHOTO">{language === 'en' ? 'Dark lighting / low contrast photograph' : 'ಕತ್ತಲೆಯಾದ ಬೆಳಕು / ಕಡಿಮೆ ಸ್ಪಷ್ಟತೆ'}</option>
                  <option value="CROPPED_DATA">{language === 'en' ? 'Critical survey number or owner line is cut off' : 'ಸರ್ವೆ ನಂಬರ್ ಅಥವಾ ಹೆಸರು ಕತ್ತರಿಸಲ್ಪಟ್ಟಿದೆ'}</option>
                  <option value="FADED_INK">{language === 'en' ? 'Faded ink / smudged cursive handwriting' : 'ಮಾಯವಾದ ಶಾಯಿ / ಓದಲಾಗದ ಕೈಬರಹ'}</option>
                  <option value="OTHER">{language === 'en' ? 'Other statutory deficiency (specify below)' : 'ಇತರ ಕಾರಣ'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'block' }}>
                  {language === 'en' ? 'Instructions to Citizen' : 'ನಾಗರಿಕರಿಗೆ ಸೂಚನೆ'}
                </label>
                <textarea
                  rows={2}
                  className="gis-search-input"
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                  placeholder={language === 'en' ? 'e.g. Please capture photo in bright daylight or upload PDF scanned copy...' : 'ದಯವಿಟ್ಟು ಹಗಲು ಬೆಳಕಿನಲ್ಲಿ ಸ್ಪಷ್ಟ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಪಿಡಿಎಫ್ ಸ್ಕ್ಯಾನ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ...'}
                  value={rescanCustomNotes}
                  onChange={(e) => setRescanCustomNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowRescanModal(false)}
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  {language === 'en' ? 'Cancel' : 'ರದ್ದುಮಾಡಿ'}
                </button>
                <button
                  type="button"
                  className="btn-resurvey"
                  onClick={handleExecuteRescanRequest}
                  disabled={isSubmitting}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  <RotateCcw size={13} style={{ marginRight: '4px' }} />
                  <span>{isSubmitting ? 'Issuing...' : (language === 'en' ? 'Issue Re-scan Notice' : 'ಸೂಚನೆ ರವಾನಿಸಿ')}</span>
                </button>
              </div>
            </div>
          </Modal>
        )}

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
                    SHA-256 Official Audit Hash:
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
