// src/pages/LoginPage/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css';
// Later, replace with a real authService
// import authService from '../../services/authService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Example stub: replace with authService.login(email, password)
      if (email === 'user@example.com' && password === 'password') {
        localStorage.setItem('token', 'fake-jwt-token');
        // localStorage.setItem('isAdmin', 'false');
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Login to Mobile Appz</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit">Login</button>
      </form>
      <p className={styles.link}>
        Don’t have an account? <Link to="/register">Sign up here</Link>
      </p>
      <p className={styles.link}>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
    </div>
  );
}
