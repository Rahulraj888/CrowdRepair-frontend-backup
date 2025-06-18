import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSidebar from './components/ProfileSidebar/ProfileSidebar';

import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ReportFormPage from './pages/ReportFormPage/ReportFormPage';
import HeatmapPage from './pages/HeatmapPage/HeatmapPage';
import AdminPanelPage from './pages/AdminPanelPage/AdminPanelPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  const { pathname } = useLocation();
  const showProfileNav = pathname === '/profile';

  return (
    <>
      <Header />

      <div className="d-flex" style={{ padding: 0, margin: 0 }}>
        {showProfileNav && <ProfileSidebar />}

        <main style={{ flex: 1, padding: 0, maxWidth: '100%' }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Protected routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/heatmap"
              element={
                <ProtectedRoute>
                  <HeatmapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPanelPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </>
  );
}

export default App;
