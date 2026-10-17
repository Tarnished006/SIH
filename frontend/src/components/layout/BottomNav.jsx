import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  FolderKanban, 
  FileText, 
  Map as MapIcon, 
  HelpCircle, 
  CheckSquare, 
  FileUp, 
  ShieldCheck, 
  Users, 
  Smartphone, 
  Activity, 
  LayoutDashboard 
} from 'lucide-react';

export const BottomNav = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItemsForRole = () => {
    switch (role) {
      case 'CITIZEN':
        return [
          {
            id: 'applications',
            path: '/applications',
            icon: FileText,
            labelEn: 'Applications',
            labelKn: 'ಅರ್ಜಿಗಳು',
          },
          {
            id: 'upload',
            path: '/upload',
            icon: FileUp,
            labelEn: 'Upload',
            labelKn: 'ಅಪ್‌ಲೋಡ್',
          },
          {
            id: 'records',
            path: '/records',
            icon: FolderKanban,
            labelEn: 'Records',
            labelKn: 'ದಾಖಲೆ',
          },
          {
            id: 'help',
            path: '/help',
            icon: HelpCircle,
            labelEn: 'Help',
            labelKn: 'ಸಹಾಯ',
          },
        ];

      case 'PATWARI':
        return [
          {
            id: 'review',
            path: '/review',
            icon: CheckSquare,
            labelEn: 'Cases',
            labelKn: 'ಪ್ರಕರಣ',
          },
          {
            id: 'upload',
            path: '/upload',
            icon: FileUp,
            labelEn: 'Intake',
            labelKn: 'ಸ್ವೀಕೃತಿ',
          },
          {
            id: 'records',
            path: '/records',
            icon: FolderKanban,
            labelEn: 'Records',
            labelKn: 'ದಾಖಲೆ',
          },
          {
            id: 'audit',
            path: '/audit',
            icon: ShieldCheck,
            labelEn: 'Audit',
            labelKn: 'ಆಡಿಟ್',
          },
        ];

      case 'TEHSILDAR':
      default:
        return [
          {
            id: 'review',
            path: '/review',
            icon: CheckSquare,
            labelEn: 'Review Queue',
            labelKn: 'ಪರಿಶೀಲನೆ',
          },
          {
            id: 'records',
            path: '/records',
            icon: FolderKanban,
            labelEn: 'Records',
            labelKn: 'ದಾಖಲೆ',
          },
          {
            id: 'audit',
            path: '/audit',
            icon: ShieldCheck,
            labelEn: 'Audit',
            labelKn: 'ಆಡಿಟ್',
          },
        ];
    }
  };

  const navItems = getNavItemsForRole();

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav" aria-label="Main Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        const label = language === 'en' ? item.labelEn : item.labelKn;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
