import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import logo from '/logo.jpeg';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  // Define nav items with access control
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', roles: ['user', 'admin'] },
    { to: '/heatmap', label: 'Heatmap', roles: ['user', 'admin'] },
    { to: '/report', label: 'New Report', roles: ['user'] },
    { to: '/admin', label: 'Admin Panel', roles: ['admin'] },
    { to: '/profile', label: 'My Profile', roles: ['user', 'admin'] },
    { to: '/my-reports', label: 'My Reports', roles: ['user'] },
  ];

  // Render individual link with active highlight
  const renderLink = ({ to, label }) => {
    const isActive = location.pathname === to;
    return (
      <li className="nav-item" key={to}>
        <Link
          to={to}
          className={`nav-link fw-bold ${isActive ? 'active text-primary' : 'text-dark'}`}
          aria-current={isActive ? 'page' : undefined}
        >
          {label}
        </Link>
      </li>
    );
  };

  return (
    <header className="shadow-sm mb-0 pb-0">
      <nav
        className="navbar navbar-expand-md navbar-light px-3 py-2"
        style={{ backgroundColor: '#75CFF0' }}
      >
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logo}
              alt="Mobile Appz Logo"
              style={{ height: '30px', marginRight: '10px' }}
            />
            <span className="fw-bold">Mobile Appz</span>
          </Link>

          {/* Mobile toggler */}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Collapsible links */}
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto align-items-center">
              {!user ? (
                <>
                  <li className="nav-item">
                    <Link
                      to="/login"
                      className={`nav-link fw-bold ${location.pathname === '/login' ? 'active text-primary' : 'text-dark'}`}
                      aria-current={location.pathname === '/login' ? 'page' : undefined}
                    >
                      Login
                    </Link>
                  </li>
                  <li className="nav-item ms-2">
                    <Link to="/register" className="btn btn-primary fw-bold px-4">
                      Sign Up
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  {navItems.map(item =>
                    item.roles.includes(user.role) ? renderLink(item) : null
                  )}
                  <li className="nav-item ms-3">
                    <button
                      className="btn btn-outline-secondary fw-bold"
                      onClick={logout}
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
