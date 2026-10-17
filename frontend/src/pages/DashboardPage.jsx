import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    switch (role) {
      case 'CITIZEN':
        navigate('/applications', { replace: true });
        break;
      case 'PATWARI':
      case 'TEHSILDAR':
        navigate('/review', { replace: true });
        break;
      default:
        navigate('/applications', { replace: true });
        break;
    }
  }, [role, navigate]);

  return null;
};

export default DashboardPage;
