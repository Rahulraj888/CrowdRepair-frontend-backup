import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import logo from '/logo.jpeg'; 

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu whenever the route changes
  useEffect(() => setMenuOpen(false), [location]);

  return (
    <header className="shadow-sm mb-0 pb-0">
      <nav className="navbar navbar-expand-lg navbar-light px-3 py-2"
      style={{ backgroundColor: '#75CFF0' }}
      >
        <div className="container-fluid">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img
              src={logo}
              alt="Logo"
              style={{ height: '30px', marginRight: '10px' }}
            />
            <span className="fw-bold">Mobile Appz</span>
          </Link>

          {/* Hamburger toggler */}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Collapsible nav links */}
          <div
            className={`collapse navbar-collapse${menuOpen ? ' show' : ''}`}
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto align-items-center">
              {!user ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link fw-bold" to="/login">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item ms-3">
                    <Link className="btn btn-primary fw-bold px-4" to="/register">
                      Sign Up
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link fw-bold" to="/dashboard">
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link fw-bold" to="/heatmap">
                      Heatmap
                    </Link>
                  </li>
                  {user.role !== 'admin' && (
                    <li className="nav-item">
                      <Link className="nav-link fw-bold" to="/report">
                        New Report
                      </Link>
                    </li>
                  )}
                  {user.role === 'admin' && (
                    <li className="nav-item">
                      <Link className="nav-link fw-bold" to="/admin">
                        Admin Panel
                      </Link>
                    </li>
                  )}
                  <li className="nav-item">
                    <Link className="nav-link fw-bold" to="/profile">
                      My Profile
                    </Link>
                  </li>
                  {user.role !== 'admin' && (
                    <li className="nav-item">
                      <Link className="nav-link fw-bold" to="/my-reports">
                        My Reports
                      </Link>
                    </li>
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
