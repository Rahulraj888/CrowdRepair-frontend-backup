import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [location]);

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link to="/" className={styles.logo}>Mobile Appz</Link>

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>

        <div className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          {!user && (
            <>
              <Link to="/login" className={styles.linkItem}>Login</Link>
              <Link to="/register" className={styles.linkItem}>Sign Up</Link>
            </>
          )}

          {user && (
            <>
              <Link to="/dashboard" className={styles.linkItem}>Dashboard</Link>
              <Link to="/report" className={styles.linkItem}>New Report</Link>
              <Link to="/heatmap" className={styles.linkItem}>Heatmap</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={styles.linkItem}>Admin Panel</Link>
              )}
              <button
                onClick={logout}
                className={`${styles.linkItem} ${styles.logoutBtn}`}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
