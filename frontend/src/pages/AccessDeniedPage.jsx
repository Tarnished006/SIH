import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, Lock, UserCheck } from 'lucide-react';

export const AccessDeniedPage = ({ attemptedRoute = null, requiredRoles = [] }) => {
  const { t } = useLanguage();
  const { user, role, switchRole } = useAuth();
  const navigate = useNavigate();

  const getRoleExplanation = () => {
    if (role === 'CITIZEN') {
      return 'Citizen accounts have self-service access to personal deed tracking, certified RTC downloads, and cadastral parcel views. Statutory mutation adjudication, record locking, and review queues are restricted to Revenue Officers under the Karnataka Land Revenue Act (Rule 14 & 38-A).';
    }
    if (role === 'PATWARI') {
      return 'Patwari accounts have field-level operational access. Final statutory mutation order signing and administrative user creation are restricted to Tehsildar and System Administrator accounts.';
    }
    if (role === 'TEHSILDAR') {
      return 'Tehsildar accounts hold statutory judicial revenue authority. System-level user creation and server administration are restricted to System Administrators.';
    }
    return 'Your current authenticated session does not possess the required RBAC permissions to access this administrative resource.';
  };

  return (
    <AppLayout title="403 ACCESS DENIED">
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '65vh',
          textAlign: 'center',
          padding: '24px 16px',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '560px',
            width: '100%',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-lg)',
            border: '1.5px solid var(--color-danger)',
          }}
        >
          {/* Shield Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-flagged font-mono">HTTP 403 FORBIDDEN</span>
              <span className="badge badge-amber font-mono">ROLE: {role}</span>
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Access Denied | ಅನಧಿಕೃತ ಪ್ರವೇಶ
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Statutory Revenue Access Governance Boundary
            </p>
          </div>

          {/* Explanation Box */}
          <div
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Lock size={13} />
              <span>Permission Notice</span>
            </div>
            <div>{getRoleExplanation()}</div>

            {requiredRoles.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                Required Statutory Roles: <strong style={{ color: 'var(--color-primary)' }}>[{requiredRoles.join(', ')}]</strong>
              </div>
            )}
          </div>

          {/* Authenticated User Stamp */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Logged in as:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.name || 'User'} ({user?.email || 'N/A'})
            </span>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
            <button
              className="toggle-btn"
              style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={14} />
              <span>Go Back</span>
            </button>

            <button
              className="btn-approve"
              style={{ flex: 1.5, padding: '10px', justifyContent: 'center' }}
              onClick={() => navigate('/dashboard')}
            >
              <Home size={14} />
              <span>Return to My Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AccessDeniedPage;
