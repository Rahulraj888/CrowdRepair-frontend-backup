// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
// If you have an authService, import it
// import authService from '../services/authService';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  // For simplicity, let’s just check localStorage for a “token” or an “isAdmin” flag.
  // In a real app you’d call authService.verifyToken() or check Firebase’s currentUser.
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Simulate token check (replace with real logic)
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!token) {
      setIsAuthorized(false);
    } else if (requireAdmin && !isAdmin) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
    setCheckingAuth(false);
  }, [requireAdmin]);

  if (checkingAuth) {
    return <p>Checking your credentials…</p>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
