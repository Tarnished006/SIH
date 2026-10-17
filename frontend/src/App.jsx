import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ReviewWorkbenchPage from './pages/ReviewWorkbenchPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import RecordsDirectoryPage from './pages/RecordsDirectoryPage';
import RecordDetailsPage from './pages/RecordDetailsPage';
import AuditLedgerPage from './pages/AuditLedgerPage';
import CitizenApplicationsPage from './pages/CitizenApplicationsPage';
import HelpContactPage from './pages/HelpContactPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Explicit Access Denied (403 Forbidden) Route */}
              <Route path="/access-denied" element={<AccessDeniedPage />} />

              {/* Root / Dashboard Router: Directs each role to their authorized default landing */}
              <Route
                path="/"
                element={
                  <RoleProtectedRoute>
                    <DashboardPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RoleProtectedRoute>
                    <DashboardPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Citizen Routes */}
              <Route
                path="/applications"
                element={
                  <RoleProtectedRoute allowedRoles={['CITIZEN']}>
                    <CitizenApplicationsPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <RoleProtectedRoute>
                    <HelpContactPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Revenue Officer Review Queue & Workbench */}
              <Route
                path="/review"
                element={
                  <RoleProtectedRoute allowedRoles={['TEHSILDAR', 'PATWARI']}>
                    <ReviewQueuePage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/review/:recordId"
                element={
                  <RoleProtectedRoute allowedRoles={['TEHSILDAR', 'PATWARI']}>
                    <ReviewWorkbenchPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Document Intake */}
              <Route
                path="/upload"
                element={
                  <RoleProtectedRoute allowedRoles={['PATWARI', 'CITIZEN']}>
                    <DocumentUploadPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <RoleProtectedRoute allowedRoles={['PATWARI', 'CITIZEN']}>
                    <DocumentUploadPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Land Records Directory & Details */}
              <Route
                path="/records"
                element={
                  <RoleProtectedRoute>
                    <RecordsDirectoryPage />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/records/:id"
                element={
                  <RoleProtectedRoute>
                    <RecordDetailsPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Cryptographic Audit Ledger */}
              <Route
                path="/audit"
                element={
                  <RoleProtectedRoute allowedRoles={['TEHSILDAR', 'PATWARI']}>
                    <AuditLedgerPage />
                  </RoleProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
