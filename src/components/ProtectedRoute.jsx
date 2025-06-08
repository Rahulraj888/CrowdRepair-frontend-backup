import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Fetch current user from API (verifies token)
        const user = await authService.getCurrentUser();

        // If admin is required and user.role isn't 'admin', block access
        if (requireAdmin && user.role !== 'admin') {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        // Any error (no token, invalid, expired) => not authorized
        setIsAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [requireAdmin]);

  if (checkingAuth) {
    return <p>Checking your credentials…</p>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
