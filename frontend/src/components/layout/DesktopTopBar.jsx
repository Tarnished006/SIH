import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  ArrowLeft, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronDown, 
  Shield 
} from 'lucide-react';

export const DesktopTopBar = ({ showBack = false }) => {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    navigate(`/records?query=${encodeURIComponent(searchVal.trim())}`);
  };

  const getDepartmentTag = () => {
    switch (role) {
      case 'CITIZEN':
        return language === 'en' ? 'Citizen Land Services' : 'ನಾಗರಿಕ ಭೂ ಸೇವೆಗಳು';
      case 'PATWARI':
        return language === 'en' ? 'Village Revenue Station' : 'ಗ್ರಾಮ ಕಂದಾಯ ವೃತ್ತ';
      case 'TEHSILDAR':
      default:
        return language === 'en' ? 'Taluk Adjudication Office' : 'ತಾಲ್ಲೂಕು ಕಂದಾಯ ನ್ಯಾಯಾಲಯ';
    }
  };

  return (
    <header className="desktop-topbar">
      {/* Left: Back button + Institutional Department / Jurisdiction breadcrumb (NO duplicate h1) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {showBack && (
          <button 
            className="toggle-btn"
            onClick={() => navigate(-1)}
            style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Go Back"
          >
            <ArrowLeft size={14} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              {language === 'en' ? 'Back' : 'ಹಿಂದೆ'}
            </span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
            {language === 'en' ? 'Government of Karnataka' : 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ'}
          </span>
          <span style={{ color: 'var(--border-strong)', opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {getDepartmentTag()}
          </span>
        </div>
      </div>

      {/* Center: Search Field */}
      <form onSubmit={handleGlobalSearch} className="desktop-search-form">
        <Search size={14} className="desktop-search-icon" />
        <input
          type="text"
          className="desktop-search-input"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder={language === 'en' 
            ? 'Search by Survey No. (e.g. 142/3), ULPIN, Village...' 
            : 'ಸರ್ವೇ ನಂ. (ಉದಾ: 142/3), ULPIN, ಅಥವಾ ಗ್ರಾಮ ಹುಡುಕಿ...'}
        />
      </form>

      {/* Right: Language, Theme, and Single Account Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language Switcher */}
        <button 
          className="toggle-btn"
          onClick={toggleLanguage}
          title={language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}
          style={{ fontSize: '11px', padding: '5px 9px', fontWeight: 700 }}
        >
          {language === 'en' ? 'ಕನ್ನಡ' : 'English'}
        </button>

        {/* Theme Switcher */}
        <button 
          className="toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{ padding: '6px' }}
        >
          {isDark ? <Sun size={14} color="var(--color-brass)" /> : <Moon size={14} />}
        </button>

        {/* Single Primary User Account Menu */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button 
            className="desktop-profile-chip"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-label="Account Menu"
          >
            <div className="desktop-chip-avatar">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>
                {role}
              </div>
            </div>
            <ChevronDown size={13} color="var(--text-muted)" />
          </button>

          {profileOpen && (
            <div className="desktop-profile-dropdown">
              <div style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  {user?.name || 'Authenticated User'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user?.email || 'user@bhumisetu.gov.in'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <span className="gov-status-pill status-pill-pending" style={{ fontSize: '9px', fontWeight: 700 }}>
                    {role}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {user?.jurisdiction?.split('•')[0] || 'Karnataka'}
                  </span>
                </div>
              </div>

              {/* Account Signout */}
              <div style={{ paddingTop: '6px' }}>
                <button
                  className="toggle-btn"
                  style={{ width: '100%', padding: '7px 8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-danger)', border: 'none' }}
                  onClick={() => { setProfileOpen(false); logout(); navigate('/login'); }}
                >
                  <LogOut size={13} />
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

export default DesktopTopBar;
