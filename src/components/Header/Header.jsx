// src/components/Header/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

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

        <div className={styles.links}>
          {!token && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}

          {token && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/report">New Report</Link>
              <Link to="/heatmap">Heatmap</Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
