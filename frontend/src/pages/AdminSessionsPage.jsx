import React, { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Smartphone, LogOut, ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export const AdminSessionsPage = () => {
  const { language } = useLanguage();
  const { role } = useAuth();

  const [activeSessions, setActiveSessions] = useState([
    {
      sessionId: 'sess-b47c9451',
      userAgent: 'Chrome 128.0 (Windows 11)',
      ip: '103.21.124.5 (Bengaluru / Magadi)',
      createdAt: 'Today, 09:30 AM',
      isCurrent: true,
      userEmail: 'admin@bhumisetu.gov.in',
      role: 'ADMIN',
    },
    {
      sessionId: 'sess-d89a1234',
      userAgent: 'Mobile Chrome (Samsung Galaxy S23 / Patwari Field Device)',
      ip: '49.207.198.12 (Ramanagara)',
      createdAt: 'Today, 08:15 AM',
      isCurrent: false,
      userEmail: 'patwari@lucknow.gov.in',
      role: 'PATWARI',
    },
    {
      sessionId: 'sess-f91c7823',
      userAgent: 'Firefox 130.0 (Ubuntu Linux / Tehsil Workstation)',
      ip: '103.21.124.9 (Magadi Sub-division)',
      createdAt: 'Today, 09:12 AM',
      isCurrent: false,
      userEmail: 'tehsildar@lucknow.gov.in',
      role: 'TEHSILDAR',
    },
  ]);

  const [notice, setNotice] = useState(null);

  const handleRevokeSession = (sessionId) => {
    setActiveSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    setNotice('Session key revoked successfully from active Redis store.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleRevokeAll = () => {
    setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
    setNotice('All remote officer sessions revoked.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <AppLayout title={language === 'kn' ? 'ಸೆಷನ್‌ಗಳು ಮತ್ತು ಭದ್ರತೆ' : 'Sessions & Security'} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">
              {language === 'kn' ? 'ಸಕ್ರಿಯ ಸೆಷನ್‌ಗಳು ಮತ್ತು ಭದ್ರತಾ ನಿಯಂತ್ರಣ' : 'Sessions & Security'}
            </h1>
            <p className="gov-page-subtitle">
              {language === 'kn'
                ? 'ಕಂದಾಯ ಅಧಿಕಾರಿಗಳು ಮತ್ತು ಸಿಬ್ಬಂದಿಯ ಸಕ್ರಿಯ ಲಾಗಿನ್ ಸೆಷನ್‌ಗಳ ನಿರ್ವಹಣೆ ಮತ್ತು ಟೋಕನ್ ನಿಯಂತ್ರಣ.'
                : 'Monitor active departmental authentication sessions, token lifespans, and revoke unauthorized device access.'}
            </p>
          </div>

          {activeSessions.length > 1 && (
            <button
              className="gov-table-action-btn"
              style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
              onClick={handleRevokeAll}
            >
              <LogOut size={12} />
              <span>{language === 'kn' ? 'ಎಲ್ಲಾ ರಿಮೋಟ್ ಸೆಷನ್‌ಗಳನ್ನು ರದ್ದುಮಾಡಿ' : 'Revoke All Remote Sessions'}</span>
            </button>
          )}
        </div>

        {notice && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '12px', fontWeight: 600 }}>
            ✓ {notice}
          </div>
        )}

        {/* Active Sessions Table */}
        <div className="gov-section">
          <div className="gov-section-header">
            <h3>{language === 'kn' ? 'ಸಕ್ರಿಯ ಸಾಧನ ಲಾಗಿನ್‌ಗಳು' : 'Active Authenticated Sessions'}</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeSessions.length} Devices Online</span>
          </div>

          <div className="gov-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Device / Browser</th>
                  <th>Authenticated Officer</th>
                  <th>Role</th>
                  <th>IP Address & Station</th>
                  <th>Login Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Session Action</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map((sess) => (
                  <tr key={sess.sessionId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={14} color="var(--color-primary)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>{sess.userAgent}</div>
                          {sess.isCurrent && (
                            <span className="gov-status-pill status-pill-verified" style={{ fontSize: '9px', padding: '1px 6px', marginTop: '2px' }}>
                              Current Session
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '12px' }}>{sess.userEmail}</span>
                    </td>
                    <td>
                      <span className="gov-status-pill status-pill-pending" style={{ fontSize: '10px' }}>
                        {sess.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px' }}>{sess.ip}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{sess.createdAt}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!sess.isCurrent ? (
                        <button
                          className="gov-table-action-btn"
                          style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                          onClick={() => handleRevokeSession(sess.sessionId)}
                        >
                          Revoke
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Policy Summary */}
        <div className="gov-section">
          <div className="gov-section-header">
            <h3>{language === 'kn' ? 'ಭದ್ರತಾ ನೀತಿಗಳು ಮತ್ತು ಟೋಕನ್ ನಿಯಮಗಳು' : 'Security Standards & Token Policies'}</h3>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JWT Access Token Lifespan</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>15 Minutes (Short-lived)</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Refresh Token Rotation</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>7 Days (Sliding window)</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RBAC Policy Enforcement</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>Strict Middleware Check</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Concurrent Officer Lock</div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>15 Min Review Lease (Redis)</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminSessionsPage;
