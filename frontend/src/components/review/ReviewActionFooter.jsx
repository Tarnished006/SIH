import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { X, RefreshCw, CheckCircle2, PenTool, Send, ShieldAlert } from 'lucide-react';

export const ReviewActionFooter = ({ onApprove, onReject, onReSurvey, isSubmitting = false }) => {
  const { t } = useLanguage();
  const { role } = useAuth();

  if (role === 'PATWARI') {
    return (
      <div className="sticky-action-footer">
        {/* Patwari Action: Request Clarification */}
        <button
          className="btn-reject"
          onClick={onReject}
          disabled={isSubmitting}
          title="Return deed to citizen with clarification notice"
        >
          <X size={14} />
          <span>ವಿವರಣೆ ಕೋರಿ (Query)</span>
        </button>

        {/* Patwari Action: Recommend Resurvey */}
        <button
          className="btn-resurvey"
          onClick={onReSurvey}
          disabled={isSubmitting}
          title="Recommend field GPS pegging to surveyor"
        >
          <RefreshCw size={13} />
          <span>ಮರು ಸರ್ವೇ ಶಿಫಾರಸು</span>
        </button>

        {/* Patwari Action: Submit Field Verification Report to Tehsildar */}
        <button
          className="btn-approve"
          onClick={onApprove}
          disabled={isSubmitting}
          title="Submit verified field survey report to Tehsildar for statutory endorsement"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Send size={14} />
          <span>{isSubmitting ? 'SUBMITTING...' : 'ವರದಿ ರವಾನಿಸಿ (Forward to Tehsildar)'}</span>
        </button>
      </div>
    );
  }

  // Tehsildar & Admin: Statutory Mutation Adjudication
  return (
    <div className="sticky-action-footer">
      {/* 1. Reject Button */}
      <button
        className="btn-reject"
        onClick={onReject}
        disabled={isSubmitting}
        title="Reject deed mutation under Rule 38-A"
      >
        <X size={14} />
        <span>{t('rejectKn')}</span>
      </button>

      {/* 2. Re-Survey Button */}
      <button
        className="btn-resurvey"
        onClick={onReSurvey}
        disabled={isSubmitting}
        title="Order statutory field resurvey"
      >
        <RefreshCw size={13} />
        <span>{t('reSurveyKn')}</span>
      </button>

      {/* 3. Sign & Approve Primary Button */}
      <button
        className="btn-approve"
        onClick={onApprove}
        disabled={isSubmitting}
        title="Digitally sign title mutation and append SHA-256 block to state revenue ledger"
      >
        <PenTool size={14} />
        <span>{isSubmitting ? 'SIGNING...' : `${t('signAndApproveKn')} (Sign & Approve)`}</span>
      </button>
    </div>
  );
};

export default ReviewActionFooter;
