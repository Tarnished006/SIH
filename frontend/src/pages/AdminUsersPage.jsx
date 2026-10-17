import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Smartphone, ArrowRight } from 'lucide-react';

export const AdminUsersPage = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([
    {
      id: 'usr-001',
      name: 'Rajesh K. Sharma',
      email: 'tehsildar@lucknow.gov.in',
      role: 'TEHSILDAR',
      jurisdiction: 'Ramanagara (Magadi Taluk)',
      status: 'ACTIVE',
      lastLogin: 'Today, 09:30 AM',
    },
    {
      id: 'usr-002',
      name: 'Amit Verma',
      email: 'patwari@lucknow.gov.in',
      role: 'PATWARI',
      jurisdiction: 'Thippagondanahalli Circle',
      status: 'ACTIVE',
      lastLogin: 'Today, 08:15 AM',
    },
    {
      id: 'usr-003',
      name: 'Priya Sundaram',
      email: 'admin@bhumisetu.gov.in',
      role: 'ADMIN',
      jurisdiction: 'State Directorate (DILRMP)',
      status: 'ACTIVE',
      lastLogin: 'Today, 10:02 AM',
    },
    {
      id: 'usr-004',
      name: 'Ramesh Kumar',
      email: 'citizen@india.in',
      role: 'CITIZEN',
      jurisdiction: 'Public Citizen Portal',
      status: 'ACTIVE',
      lastLogin: 'Yesterday, 04:20 PM',
    },
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'PATWARI', jurisdiction: '' });
  const [notice, setNotice] = useState(null);

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    setUsers((prev) => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        jurisdiction: newUser.jurisdiction || 'General',
        status: 'ACTIVE',
        lastLogin: 'Never',
      },
    ]);

    setNewUser({ name: '', email: '', role: 'PATWARI', jurisdiction: '' });
    setShowAddUser(false);
    setNotice(`User account ${newUser.email} provisioned successfully.`);
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <AppLayout title={language === 'kn' ? 'ಬಳಕೆದಾರರು ಮತ್ತು ಪಾತ್ರಗಳು' : 'Users & Roles'} desktopExpanded={true}>
      <div className="gov-page-container">
        {/* Header */}
        <div className="gov-page-header">
          <div>
            <h1 className="gov-page-title">
              {language === 'kn' ? 'ಬಳಕೆದಾರರು ಮತ್ತು ಅಧಿಕೃತ ಪಾತ್ರಗಳು' : 'Users & Roles Directory'}
            </h1>
            <p className="gov-page-subtitle">
              {language === 'kn'
                ? 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ, ತಹಶೀಲ್ದಾರ್, ಪಟವಾರಿ ಖಾತೆಗಳ ನಿರ್ವಹಣೆ ಮತ್ತು ಪಾತ್ರ ಆಧಾರಿತ ಅಧಿಕಾರ ನಿಯಂತ್ರಣ (RBAC).'
                : 'Manage departmental officer accounts, role-based access control, and jurisdiction assignments.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="gov-table-action-btn"
              onClick={() => navigate('/admin/sessions')}
            >
              <Smartphone size={13} />
              <span>{language === 'kn' ? 'ಸೆಷನ್‌ಗಳ ನಿರ್ವಹಣೆ' : 'Active Sessions'}</span>
            </button>
            <button
              className="gov-table-action-btn"
              style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', borderColor: 'var(--color-primary)' }}
              onClick={() => setShowAddUser(!showAddUser)}
            >
              <UserPlus size={14} />
              <span>{showAddUser ? 'Close Form' : (language === 'kn' ? 'ಹೊಸ ಅಧಿಕಾರಿ ಸೇರಿಸಿ' : 'Provision Official')}</span>
            </button>
          </div>
        </div>

        {notice && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #22c55e', color: '#15803d', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '12px', fontWeight: 600 }}>
            ✓ {notice}
          </div>
        )}

        {/* Provision Form */}
        {showAddUser && (
          <div className="gov-section" style={{ marginBottom: '20px' }}>
            <div className="gov-section-header">
              <h3>{language === 'kn' ? 'ಹೊಸ ಅಧಿಕಾರಿ ವಿವರಗಳು' : 'Provision New Official / Officer'}</h3>
            </div>
            <form onSubmit={handleCreateUser} style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Anand Gowda"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. anand@karnataka.gov.in"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Role (RBAC)
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="PATWARI">PATWARI (Village Accountant)</option>
                  <option value="TEHSILDAR">TEHSILDAR (Statutory Authority)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Assigned Jurisdiction
                </label>
                <input
                  type="text"
                  value={newUser.jurisdiction}
                  onChange={(e) => setNewUser({ ...newUser, jurisdiction: e.target.value })}
                  placeholder="e.g. Magadi Circle"
                  style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="gov-table-action-btn"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff', borderColor: 'var(--color-primary)', width: '100%', padding: '8px' }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User Directory Table */}
        <div className="gov-section">
          <div className="gov-section-header">
            <h3>{language === 'kn' ? 'ಅಧಿಕೃತ ಬಳಕೆದಾರರ ಪಟ್ಟಿ' : 'Authorized Personnel & Roles'}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{users.length} Registered Accounts</span>
          </div>
          <div className="gov-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>Official Name</th>
                  <th>Email ID</th>
                  <th>Designated Role</th>
                  <th>Assigned Jurisdiction</th>
                  <th>Account Status</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '12px' }}>{u.email}</span>
                    </td>
                    <td>
                      <span className="gov-status-pill status-pill-pending" style={{ fontWeight: 700 }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{u.jurisdiction}</div>
                    </td>
                    <td>
                      <span className="gov-status-pill status-pill-verified">
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{u.lastLogin}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminUsersPage;
