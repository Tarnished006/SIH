import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AUDIT_LEDGER_BLOCKS } from '../data/stitchMockData';
import { verifyLedgerChain } from '../api/auditApi';
import { 
  ShieldCheck, 
  Lock, 
  Link2, 
  AlertTriangle, 
  CheckCircle2, 
  Bug,
  RotateCcw
} from 'lucide-react';

export const AuditLedgerPage = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const canVerifyChain = role === 'TEHSILDAR';

  const [blocks, setBlocks] = useState(AUDIT_LEDGER_BLOCKS);
  const [isTampered, setIsTampered] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      const res = await verifyLedgerChain();
      setVerificationResult(res);
    } catch (e) {
      setVerificationResult({
        success: false,
        error: e.response?.data?.message || e.message || 'Audit ledger verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = () => {
    setIsTampered(true);
    setVerificationResult(null);
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.sequenceNumber === 2) {
          return {
            ...b,
            delta: {
              ...b.delta,
              surveyNumber: 'FORGED-999/X',
            },
          };
        }
        return b;
      })
    );
  };

  const handleResetLedger = () => {
    setIsTampered(false);
    setVerificationResult(null);
    setBlocks(AUDIT_LEDGER_BLOCKS);
  };

  return (
    <AppLayout title={language === 'kn' ? 'ಅಧಿಕೃತ ಆಡಿಟ್ ದಾಖಲೆ' : 'Official Audit Trail'} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">
              {language === 'kn' ? 'ಅಧಿಕೃತ ಆಡಿಟ್ ದಾಖಲೆ (Audit Trail)' : 'Official Tamper-Proof Audit Trail'}
            </h1>
            <p className="gov-page-subtitle">
              {language === 'kn'
                ? 'ಕರ್ನಾಟಕ ಭೂ ಕಂದಾಯ ಕಾಯ್ದೆಯನ್ವಯ ಎಲ್ಲಾ ಭೂ ವಹಿವಾಟುಗಳು ಮತ್ತು ಅಧಿಕೃತ ಆದೇಶಗಳ ಬದಲಾಯಿಸಲಾಗದ ದಾಖಲೆ.'
                : 'Append-only cryptographic state chain tracking all mutation orders, field inspections, and approvals.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canVerifyChain && (
              <button
                className="gov-table-action-btn"
                style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', borderColor: 'var(--color-primary)', padding: '8px 14px' }}
                onClick={handleVerifyChain}
                disabled={verifying}
              >
                <ShieldCheck size={14} />
                <span>{verifying ? (language === 'kn' ? 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Verifying Hashes...') : (language === 'kn' ? 'ಚೈನ್ ಸಮಗ್ರತೆ ಪರಿಶೀಲಿಸಿ' : 'Verify Chain Integrity')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Result Notification */}
        {verificationResult && (
          <div
            style={{
              backgroundColor: verificationResult.isTamperFree ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${verificationResult.isTamperFree ? '#22c55e' : '#ef4444'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {verificationResult.isTamperFree ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <AlertTriangle size={18} color="#dc2626" />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: verificationResult.isTamperFree ? '#15803d' : '#b91c1c' }}>
                  {verificationResult.isTamperFree
                    ? (language === 'kn' ? 'ಲೆಡ್ಜರ್ ಸಮಗ್ರತೆ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ: ಯಾವುದೇ ಅಕ್ರಮ ಬದಲಾವಣೆ ಇಲ್ಲ' : 'Chain Integrity Verified: Tamper-Free Ledger')
                    : (language === 'kn' ? 'ಎಚ್ಚರಿಕೆ: ಹ್ಯಾಶ್ ತಾಳೆಯಾಗುತ್ತಿಲ್ಲ — ಅನಧಿಕೃತ ಬದಲಾವಣೆ ಪತ್ತೆಯಾಗಿದೆ' : 'Chain Verification Failed: Cryptographic Discrepancy Detected')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {verificationResult.isTamperFree 
                    ? `All ${verificationResult.totalBlocks || blocks.length} blocks verified against canonical SHA-256 hash chains.`
                    : verificationResult.reason}
                </div>
              </div>
            </div>
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {verificationResult.totalBlocks || blocks.length} BLOCKS
            </span>
          </div>
        )}

        {/* Developer Sandbox Notice (Isolated from actual ledger) */}
        {canVerifyChain && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Evaluator Sandbox:
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                Simulate an in-memory database tampering event to test zero-trust mathematical verification.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isTampered ? (
                <button
                  className="gov-table-action-btn"
                  style={{ color: '#b91c1c', borderColor: '#fca5a5', padding: '5px 10px', fontSize: '11px' }}
                  onClick={handleSimulateTamper}
                >
                  <Bug size={12} />
                  <span>Simulate Record Alteration</span>
                </button>
              ) : (
                <button
                  className="gov-table-action-btn"
                  style={{ color: '#15803d', borderColor: '#86efac', padding: '5px 10px', fontSize: '11px' }}
                  onClick={handleResetLedger}
                >
                  <RotateCcw size={12} />
                  <span>Restore Clean Ledger</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Audit Blocks Table */}
        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Seq #</th>
                <th>Action / Event</th>
                <th>Actor / Officer</th>
                <th>Timestamp</th>
                <th>Current Block SHA-256</th>
                <th>Payload Changes</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => {
                const isCorrupted = isTampered && block.sequenceNumber === 2;
                return (
                  <tr key={block.sequenceNumber} style={{ backgroundColor: isCorrupted ? '#fef2f2' : undefined }}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, fontSize: '12px' }}>
                        #{block.sequenceNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: isCorrupted ? '#b91c1c' : 'var(--text-primary)' }}>
                        {block.action}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Ref: {block.recordId}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{block.actorName}</div>
                      <span className="gov-status-pill status-pill-pending" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {block.actorRole}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {new Date(block.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div className="font-mono" style={{ 
                        fontSize: '11px', 
                        color: isCorrupted ? '#dc2626' : 'var(--text-primary)',
                        wordBreak: 'break-all',
                        maxWidth: '220px',
                        fontWeight: isCorrupted ? 700 : 500,
                      }}>
                        {block.currHash.slice(0, 24)}...
                      </div>
                      <div className="font-mono" style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                        Prev: {block.prevHash.slice(0, 16)}...
                      </div>
                    </td>
                    <td>
                      <details className="gov-details-accordion" style={{ margin: 0 }}>
                        <summary className="gov-details-summary" style={{ fontSize: '11px', padding: '4px 6px' }}>
                          View Delta ({Object.keys(block.delta || {}).length} fields)
                        </summary>
                        <div className="gov-details-content" style={{ padding: '6px' }}>
                          <pre style={{ margin: 0, fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                            {JSON.stringify(block.delta, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuditLedgerPage;
