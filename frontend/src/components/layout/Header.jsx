import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  ArrowLeft 
} from 'lucide-react';

export const Header = ({ showBack = false, title = null }) => {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, role, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path === '/records') return role === 'CITIZEN' ? (language === 'en' ? 'My Records' : 'ನನ್ನ ದಾಖಲೆ') : (language === 'en' ? 'Directory' : 'ದಾಖಲೆ ಕೋಶ');
    if (path.startsWith('/records/')) return language === 'en' ? 'Record Details' : 'ದಾಖಲೆ ವಿವರ';
    if (path === '/applications') return language === 'en' ? 'My Applications' : 'ನನ್ನ ಅರ್ಜಿಗಳು';
    if (path === '/help') return language === 'en' ? 'Help & Support' : 'ಸಹಾಯ ಮತ್ತು ಸಂಪರ್ಕ';
    if (path === '/review') return role === 'PATWARI' ? (language === 'en' ? 'Assigned Queue' : 'ನಿಯೋಜಿತ ಪ್ರಕರಣ') : (language === 'en' ? 'Review Queue' : 'ಪರಿಶೀಲನಾ ಪಟ್ಟಿ');
    if (path.startsWith('/review/')) return language === 'en' ? 'Case Workbench' : 'ಪ್ರಕರಣ ಪರಿಶೀಲನೆ';
    if (path === '/upload') return language === 'en' ? 'Document Intake' : 'ದಾಖಲೆ ಸ್ವೀಕೃತಿ';
    if (path === '/audit') return language === 'en' ? 'Audit Ledger' : 'ಆಡಿಟ್ ಲೆಡ್ಜರ್';
    return 'BhumiSetu';
  };

  const handleBrandClick = () => {
    if (role === 'CITIZEN') navigate('/applications');
    else navigate('/review');
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        {showBack ? (
          <button 
            className="toggle-btn"
            onClick={() => navigate(-1)}
            aria-label="Go Back"
            style={{ padding: '6px' }}
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <div 
          className="brand-emblem" 
          onClick={handleBrandClick} 
          style={{ cursor: 'pointer' }}
          title="BhumiSetu Portal"
        >
          <svg width="20" height="20" viewBox="0 0 100 100">
            <polygon points="50,6 94,28 94,72 50,94 6,72 6,28" fill="none" stroke="currentColor" strokeWidth="6" />
            <polygon points="50,22 80,37 80,63 50,78 20,63 20,37" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="4" />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
          </svg>
        </div>

        <div 
          className="brand-text" 
          onClick={handleBrandClick} 
          style={{ cursor: 'pointer' }}
        >
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
            <span>{language === 'en' ? 'BhumiSetu' : 'ಭೂಮಿಸೇತು'}</span>
          </div>
          <div className="brand-subtitle">{getPageTitle()}</div>
        </div>
      </div>

      <div className="header-actions">
        {/* Language Switcher */}
        <button 
          className="toggle-btn" 
          onClick={toggleLanguage}
          title={language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}
          style={{ fontSize: '11px', padding: '4px 8px', fontWeight: 700 }}
        >
          {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
        </button>

        {/* Global Light / Dark Theme Toggle */}
        <button 
          className="toggle-btn" 
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
          style={{ padding: '6px' }}
        >
          {isDark ? <Sun size={15} color="var(--color-brass)" /> : <Moon size={15} />}
        </button>

        {/* User Avatar & Menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            className="user-avatar-btn"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-label="User Account"
            title={`${user?.name || 'User'} (${role})`}
          >
            <User size={17} />
          </button>

          {userMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '12px',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {user?.email || 'user@bhumisetu.gov.in'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span className="gov-status-pill status-pill-pending" style={{ fontSize: '9px', fontWeight: 700 }}>
                    {role}
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: '2px' }}>
                <button
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--color-danger)',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => { setUserMenuOpen(false); logout(); navigate('/login'); }}
                >
                  <LogOut size={14} />
                  <span>{language === 'en' ? 'Sign Out' : 'ನಿರ್ಗಮಿಸಿ (Logout)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
