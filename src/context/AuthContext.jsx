import { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const publicPaths = ['/login','/register','/verify-email','/forgot-password','/reset-password'];
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

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login', { replace: true });
  };

  const updateProfile = async (updates) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
