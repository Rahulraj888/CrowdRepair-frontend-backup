// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ReportFormPage from './pages/ReportFormPage/ReportFormPage';
import HeatmapPage from './pages/HeatmapPage/HeatmapPage';
import AdminPanelPage from './pages/AdminPanelPage/AdminPanelPage';

import './index.css';  // global reset + base styles

function App() {
  return (
    <BrowserRouter>
      <Header />

      <main style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes (user must be logged in) */}
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

          {/* Protected route (admin only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback: redirect any unknown URL to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
