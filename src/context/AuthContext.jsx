import { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Fetch current user on protected routes
  useEffect(() => {
    const publicPaths = [
      '/login',
      '/register',
      '/verify-email',
      '/forgot-password',
      '/reset-password'
    ];

    if (publicPaths.some(p => pathname.startsWith(p))) {
      setUser(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }

    (async () => {
      try {
        const u = await authService.getCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      }
    })();
  }, [pathname]);

  // Logout helper
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setUser(null);
    navigate('/login', { replace: true });
  };

  // Update profile helper
  const updateProfile = async (updates) => {
    // calls the service, then syncs context
    const updatedUser = await authService.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
