import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [menuOpen, setMenuOpen] = useState(false);

  console.log(styles);
  // Close menu when the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>
          Mobile Appz
        </Link>

        {/* Hamburger button */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle menu"
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>

        {/* The links container: it should gain the `linksOpen` class when menuOpen===true */}
        <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          {!token && (
            <>
              <Link to="/login" className={styles.linkItem}>Login</Link>
              <Link to="/register" className={styles.linkItem}>Sign Up</Link>
            </>
          )}

          {token && (
            <>
              <Link to="/dashboard" className={styles.linkItem}>Dashboard</Link>
              <Link to="/report" className={styles.linkItem}>New Report</Link>
              <Link to="/heatmap" className={styles.linkItem}>Heatmap</Link>
              <button onClick={handleLogout} className={`${styles.linkItem} ${styles.logoutBtn}`}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
