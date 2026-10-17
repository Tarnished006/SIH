import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Sun, Moon, ArrowRight, UserPlus, LogIn, ShieldAlert } from 'lucide-react';

export const LoginPage = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { login, register, loading, authError } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setRegSuccessMessage('');
    const result = await login(email, password);
    if (result.success) {
      if (result.user.role === 'CITIZEN') {
        navigate('/applications');
      } else {
        navigate('/review');
      }
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMessage('');

    if (regPassword !== regConfirmPassword) {
      setRegError(language === 'en' ? 'Passwords do not match' : 'ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ');
      return;
    }

    if (regPassword.length < 6) {
      setRegError(language === 'en' ? 'Password must be at least 6 characters' : 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ ೬ ಅಕ್ಷರಗಳನ್ನು ಹೊಂದಿರಬೇಕು');
      return;
    }

    const result = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
    });

    if (result.success) {
      setRegSuccessMessage(
        language === 'en' 
          ? 'Registration successful! You may now sign in with your citizen credentials.' 
          : 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! ನಿಮ್ಮ ಲಾಗಿನ್ ವಿವರಗಳೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.'
      );
      setEmail(regEmail);
      setPassword('');
      setActiveTab('login');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
    } else {
      setRegError(result.error);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Top Controls: Jurisdiction & Language/Theme */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="gov-status-pill status-pill-pending" style={{ fontSize: '10px' }}>
            Government of Karnataka • DILRMP
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="toggle-btn" onClick={toggleLanguage} style={{ fontSize: '11px', padding: '4px 8px' }}>
              {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
            </button>
            <button className="toggle-btn" onClick={toggleTheme} style={{ padding: '6px' }}>
              {isDark ? <Sun size={13} color="var(--color-brass)" /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        {/* Official Portal Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div className="brand-emblem" style={{ width: '46px', height: '46px' }}>
            <svg width="24" height="24" viewBox="0 0 100 100">
              <polygon points="50,6 94,28 94,72 50,94 6,72 6,28" fill="none" stroke="currentColor" strokeWidth="6" />
              <polygon points="50,22 80,37 80,63 50,78 20,63 20,37" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="4" />
              <circle cx="50" cy="50" r="8" fill="currentColor" />
            </svg>
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            BhumiSetu | ಭೂಮಿಸೇತು
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {language === 'en' ? 'Official Land Records Digitization & Verification Portal' : 'ಅಧಿಕೃತ ಭೂ ದಾಖಲೆಗಳ ಗಣಕೀಕರಣ ಮತ್ತು ಪರಿಶೀಲನಾ ಪೋರ್ಟಲ್'}
          </p>
        </div>

        {/* Tab Selector: Sign In vs Citizen Registration */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', gap: '8px' }}>
          <button
            type="button"
            className="toggle-btn"
            style={{
              flex: 1,
              padding: '8px',
              borderBottom: activeTab === 'login' ? '2px solid var(--color-primary)' : '2px solid transparent',
              borderRadius: 0,
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'login' ? 700 : 500,
              color: activeTab === 'login' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '12px',
            }}
            onClick={() => { setActiveTab('login'); setRegError(''); }}
          >
            <LogIn size={13} />
            <span>{language === 'en' ? 'Sign In' : 'ಲಾಗಿನ್'}</span>
          </button>
          <button
            type="button"
            className="toggle-btn"
            style={{
              flex: 1,
              padding: '8px',
              borderBottom: activeTab === 'register' ? '2px solid var(--color-primary)' : '2px solid transparent',
              borderRadius: 0,
              backgroundColor: 'transparent',
              fontWeight: activeTab === 'register' ? 700 : 500,
              color: activeTab === 'register' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '12px',
            }}
            onClick={() => { setActiveTab('register'); setRegSuccessMessage(''); }}
          >
            <UserPlus size={13} />
            <span>{language === 'en' ? 'Citizen Registration' : 'ನಾಗರಿಕ ನೋಂದಣಿ'}</span>
          </button>
        </div>

        {regSuccessMessage && (
          <div style={{ fontSize: '11.5px', color: 'var(--color-success)', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--color-success)', padding: '8px 10px', borderRadius: 'var(--radius-xs)' }}>
            {regSuccessMessage}
          </div>
        )}

        {/* Tab 1: Sign In Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {t('emailAddress')}
              </label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="gis-search-input"
                  style={{ width: '100%', paddingLeft: '32px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {t('password')}
              </label>
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <Lock size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="gis-search-input"
                  style={{ width: '100%', paddingLeft: '32px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {authError && (
              <div style={{ fontSize: '11px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)', padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn-approve"
              style={{ padding: '11px', width: '100%', marginTop: '6px', fontSize: '13px' }}
              disabled={loading}
            >
              <span>{loading ? (language === 'en' ? 'Authenticating...' : 'ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...') : t('signInButton')}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Tab 2: Citizen Self-Registration Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {language === 'en' ? 'Full Legal Name' : 'ಪೂರ್ಣ ಹೆಸರು'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'en' ? 'e.g. Ramesh Kumar' : 'ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್'}
                className="gis-search-input"
                style={{ width: '100%', marginTop: '4px' }}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {language === 'en' ? 'Email Address' : 'ಇಮೇಲ್ ವಿಳಾಸ'}
              </label>
              <input
                type="email"
                required
                placeholder="citizen@example.com"
                className="gis-search-input"
                style={{ width: '100%', marginTop: '4px' }}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {language === 'en' ? 'Create Password (min 6 characters)' : 'ಪಾಸ್‌ವರ್ಡ್ ರಚಿಸಿ (ಕನಿಷ್ಠ ೬ ಅಕ್ಷರಗಳು)'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="gis-search-input"
                style={{ width: '100%', marginTop: '4px' }}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {language === 'en' ? 'Confirm Password' : 'ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="gis-search-input"
                style={{ width: '100%', marginTop: '4px' }}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
            </div>

            {regError && (
              <div style={{ fontSize: '11px', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-subtle)', padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}>
                {regError}
              </div>
            )}

            <button
              type="submit"
              className="btn-approve"
              style={{ padding: '11px', width: '100%', marginTop: '6px', fontSize: '13px' }}
              disabled={loading}
            >
              <span>{loading ? (language === 'en' ? 'Registering...' : 'ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ...') : (language === 'en' ? 'Create Citizen Account' : 'ನಾಗರಿಕ ಖಾತೆ ರಚಿಸಿ')}</span>
              <UserPlus size={14} />
            </button>
          </form>
        )}

        {/* Staff Provisioning Notice */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldAlert size={14} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {language === 'en'
              ? 'Revenue Officer Notice: Patwari and Tehsildar accounts are securely provisioned by administrative command. Public registration creates Citizen accounts only.'
              : 'ಕಂದಾಯ ಅಧಿಕಾರಿ ಸೂಚನೆ: ಪಟ್ವಾರಿ ಮತ್ತು ತಹಶೀಲ್ದಾರ್ ಖಾತೆಗಳನ್ನು ಆಡಳಿತಾತ್ಮಕವಾಗಿ ಒದಗಿಸಲಾಗುತ್ತದೆ. ಸಾರ್ವಜನಿಕ ನೋಂದಣಿ ಕೇವಲ ನಾಗರಿಕ ಖಾತೆಗಳನ್ನು ಮಾತ್ರ ಸೃಷ್ಟಿಸುತ್ತದೆ.'}
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '10.5px', color: 'var(--text-muted)' }}>
          {language === 'en' ? 'Government of Karnataka • Department of Revenue' : 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಕಂದಾಯ ಇಲಾಖೆ'}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
