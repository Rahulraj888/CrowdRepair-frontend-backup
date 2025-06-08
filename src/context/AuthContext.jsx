import { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  //TODO: check the verification flow and remove the public api check
  useEffect(() => {
    // List of public routes where we should NOT call /me
    const publicPaths = [
      '/login',
      '/register',
      '/verify-email',
      '/forgot-password',
      '/reset-password'
    ];

    // If the current path starts with any public path, skip fetching /me
    if (publicPaths.some(p => pathname.startsWith(p))) {
      setUser(null);
      return;
    }

    // Otherwise, only fetch /me if there's a token
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
    localStorage.removeItem('isAdmin');
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
