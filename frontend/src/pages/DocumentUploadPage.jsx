import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { 
  FileUp, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  FileCheck, 
  Clock,
  RefreshCw
} from 'lucide-react';

export const DocumentUploadPage = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState({ stage: 'IDLE', percent: 0, message: '' });
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg(null);
    setUploadResult(null);
  };

  const handleStartIngestion = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setUploadResult(null);
    setProgressState({ 
      stage: 'UPLOADING', 
      percent: 25, 
      message: language === 'en' ? 'Uploading document to secure server...' : 'ದಾಖಲೆಯನ್ನು ಸರ್ವರ್‌ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' 
    });

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      // 1. Upload to backend
      const uploadRes = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!uploadRes.data?.success) {
        throw new Error(uploadRes.data?.error || 'Document upload failed');
      }

      const documentId = uploadRes.data.document.id;
      const isDuplicate = uploadRes.data.isDuplicate;

      if (isDuplicate) {
        setProgressState({
          stage: 'DUPLICATE',
          percent: 100,
          message: language === 'en' ? 'Duplicate document detected.' : 'ನಕಲಿ ದಾಖಲೆ ಪತ್ತೆಯಾಗಿದೆ.',
        });
        setUploadResult({
          documentId,
          isDuplicate: true,
          message: uploadRes.data.message || 'This document has already been uploaded previously.',
        });
        setIsProcessing(false);
        return;
      }

      // 2. Poll for OCR processing completion
      setProgressState({ 
        stage: 'OCR', 
        percent: 65, 
        message: language === 'en' ? 'Performing OCR extraction & revenue validation...' : 'ಒಸಿಆರ್ ಮೂಲಕ ದತ್ತಾಂಶ ಹೊರತೆಗೆಯಲಾಗುತ್ತಿದೆ...' 
      });

      let foundRecord = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        try {
          const checkRes = await apiClient.get('/records/my-applications');
          if (checkRes.data?.success && checkRes.data.applications?.length > 0) {
            const matched = checkRes.data.applications.find(
              (a) => a.documentId === documentId || a.document?.id === documentId
            );
            if (matched) {
              foundRecord = matched;
              break;
            }
          }
        } catch (checkErr) {
          // ignore transient poll error
        }
      }

      setProgressState({ 
        stage: 'DONE', 
        percent: 100, 
        message: language === 'en' ? 'Document ingested & processed successfully.' : 'ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕ್ರಿಯೆಗೊಂಡಿದೆ.' 
      });

      setUploadResult({
        documentId,
        record: foundRecord,
        recordId: foundRecord?.id,
      });
    } catch (err) {
      console.error('[INGESTION_ERROR]', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed';
      setErrorMsg(msg);
      setProgressState({ stage: 'ERROR', percent: 0, message: '' });
    } finally {
      setIsProcessing(false);
    }
  };

  const pageTitle = role === 'CITIZEN' 
    ? (language === 'en' ? 'Submit Land Deed / Application' : 'ದಾಖಲೆ ಸಲ್ಲಿಕೆ')
    : (language === 'en' ? 'Document Ingestion' : 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್');

  return (
    <AppLayout desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h2 className="gov-page-title">{pageTitle}</h2>
            <div className="gov-page-subtitle">
              {language === 'en'
                ? 'Upload Registered Deeds, RTC Form 16, or Mutation Orders for Verification'
                : 'ಪರಿಶೀಲನೆಗಾಗಿ ನೋಂದಾಯಿತ ಕ್ರಯಪತ್ರ, ಪಹಣಿ (RTC) ಅಥವಾ ಮ್ಯುಟೇಶನ್ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ'}
            </div>
          </div>
          <div className="gov-badge-info">
            {language === 'en' ? 'DILRMP Intake' : 'ಕಂದಾಯ ದಾಖಲೆ ಸಲ್ಲಿಕೆ'}
          </div>
        </div>

        {/* Dropzone */}
        <div
          className="gov-upload-dropzone"
          onClick={() => document.getElementById('scan-file-input').click()}
          style={{ cursor: 'pointer' }}
        >
          <input
            id="scan-file-input"
            type="file"
            accept="image/jpeg,image/png,image/tiff,image/webp,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <div className="gov-upload-icon-circle">
            <FileUp size={24} color="var(--color-primary)" />
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedFile ? selectedFile.name : (language === 'en' ? 'Select or drop land document here' : 'ದಾಖಲೆ ಕಡತವನ್ನು ಇಲ್ಲಿ ಆಯ್ಕೆಮಾಡಿ')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {selectedFile 
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • ${language === 'en' ? 'Ready for upload' : 'ಅಪ್‌ಲೋಡ್‌ಗೆ ಸಿದ್ಧವಾಗಿದೆ'}`
                : (language === 'en' 
                    ? 'Supported: PDF, JPEG, PNG, TIFF, WEBP (Max 25 MB) • Real Document OCR Processing' 
                    : 'ಪಿಡಿಎಫ್, ಜೆಪಿಇಜಿ, ಪಿಎನ್‌ಜಿ, ಟಿಫ್ (ಗರಿಷ್ಠ 25 MB)')}
            </div>
          </div>

          {selectedFile && (
            <button 
              className="gov-table-action-btn"
              style={{ fontSize: '11px', padding: '5px 12px' }}
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadResult(null); setErrorMsg(null); }}
            >
              {language === 'en' ? 'Change File' : 'ಬೇರೆ ಕಡತ ಆಯ್ಕೆಮಾಡಿ'}
            </button>
          )}
        </div>

        {errorMsg && (
          <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Processing Status Bar */}
        {isProcessing && (
          <div className="gov-section" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>{progressState.message}</span>
              <span className="gov-table-mono-highlight">{progressState.percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${progressState.percent}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--color-primary)', 
                  transition: 'width 0.4s ease' 
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Button & Real Result */}
        {selectedFile && !isProcessing && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!uploadResult ? (
              <button
                className="btn-approve"
                style={{ width: '100%', padding: '11px 16px', fontSize: '13px', justifyContent: 'center' }}
                onClick={handleStartIngestion}
              >
                <FileCheck size={16} />
                <span>{language === 'en' ? 'Upload & Process Document' : 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಪ್ರಕ್ರಿಯೆ ಪ್ರಾರಂಭಿಸಿ'}</span>
              </button>
            ) : (
              <div className="gov-result-box" style={{ padding: '16px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: uploadResult.isDuplicate ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 700, fontSize: '14px' }}>
                  {uploadResult.isDuplicate ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>
                    {uploadResult.isDuplicate 
                      ? (language === 'en' ? 'Duplicate Document Notice' : 'ನಕಲಿ ದಾಖಲೆ ಸೂಚನೆ')
                      : (language === 'en' ? 'Document Ingested Successfully' : 'ದಾಖಲೆ ಯಶಸ್ವಿಯಾಗಿ ಸ್ವೀಕರಿಸಲ್ಪಟ್ಟಿದೆ')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {uploadResult.message || (language === 'en'
                    ? 'Document has been saved to persistent storage and passed through the OCR extraction pipeline.'
                    : 'ದಾಖಲೆಯನ್ನು ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದ್ದು, ಒಸಿಆರ್ ಪ್ರಕ್ರಿಯೆಗೆ ಒಳಪಡಿಸಲಾಗಿದೆ.')}
                </div>

                {uploadResult.record && (
                  <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                      {language === 'en' ? 'Persisted Record Information:' : 'ದಾಖಲೆ ಮಾಹಿತಿ:'}
                    </div>
                    <div><strong>Survey No:</strong> {uploadResult.record.surveyNumber || 'N/A'}</div>
                    <div><strong>Village:</strong> {uploadResult.record.villageName || 'Karnataka'}</div>
                    <div><strong>Area:</strong> {uploadResult.record.rawArea ? `${uploadResult.record.rawArea} ${uploadResult.record.rawUnit || 'Acre'}` : 'N/A'}</div>
                    <div><strong>Confidence:</strong> {uploadResult.record.overallConfidence ? `${(Number(uploadResult.record.overallConfidence) * 100).toFixed(1)}%` : 'N/A'}</div>
                    <div><strong>Status:</strong> {uploadResult.record.reviewStatus}</div>
                  </div>
                )}

                <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                  {role === 'CITIZEN' ? (
                    <button
                      className="btn-approve"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => navigate('/applications')}
                    >
                      <span>{language === 'en' ? 'View in My Applications' : 'ನನ್ನ ಅರ್ಜಿಗಳಲ್ಲಿ ನೋಡಿ'}</span>
                      <ChevronRight size={13} />
                    </button>
                  ) : (
                    <button
                      className="btn-approve"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      onClick={() => navigate(uploadResult.recordId ? `/review/${uploadResult.recordId}` : '/review')}
                    >
                      <span>{language === 'en' ? 'Open in Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿಗೆ ಹೋಗಿ'}</span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                  <button
                    className="toggle-btn"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                    onClick={() => { setSelectedFile(null); setUploadResult(null); }}
                  >
                    <span>{language === 'en' ? 'Upload Another' : 'ಮತ್ತೊಂದು ಅಪ್‌ಲೋಡ್'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DocumentUploadPage;
