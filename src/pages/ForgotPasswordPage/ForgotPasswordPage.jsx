import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await authService.forgotPassword(email);
      setMessage('Password reset email sent. Please Check your inbox.');
    } catch (err) {
      const resp = err.response?.data;
      const msg = resp?.errors?.[0]?.msg || resp?.msg || err.message || "Failed to send reset email";
      setError(msg);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Forgot Password</h2>
      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <button type="submit">Send Reset Link</button>
      </form>
      <p className={styles.link}>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
}
