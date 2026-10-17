import React from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import DesktopSidebar from './DesktopSidebar';
import DesktopTopBar from './DesktopTopBar';

export const AppLayout = ({ 
  children, 
  showBack = false, 
  title = null, 
  desktopExpanded = false,
  fullWidth = false,
  noPadding = false 
}) => {
  return (
    <div className="app-wrapper">
      {/* 1. Desktop Fixed Sidebar Navigation (visible >= 1024px) */}
      <DesktopSidebar />

      {/* 2. Main Content Wrapper */}
      <div className={`app-main-area ${fullWidth ? 'app-main-full' : ''}`}>
        {/* Mobile Top Header (hidden on desktop >= 1024px) */}
        <div className="mobile-only-header">
          <Header showBack={showBack} title={title} />
        </div>

        {/* Desktop Top Bar (visible on desktop >= 1024px) */}
        <div className="desktop-only-topbar">
          <DesktopTopBar showBack={showBack} title={title} />
        </div>

        {/* Main Content Body */}
        <main className={`main-content ${noPadding ? 'no-padding' : ''} ${desktopExpanded ? 'desktop-expanded' : ''}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation (hidden on desktop >= 1024px) */}
        <div className="mobile-only-bottomnav">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
