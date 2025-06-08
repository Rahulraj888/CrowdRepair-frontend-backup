import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendErr, setResendErr] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);

    try {
      const { token } = await authService.login(email, password);
      localStorage.setItem('token', token);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      navigate('/dashboard');
    } catch (err) {
      //Extract error messages from backend response
      const resp = err.response?.data;
      const msg =
        resp?.errors?.[0]?.msg || resp?.msg || err.message || 'Login failed';
      setError(msg);
      if (msg.toLowerCase().includes('verify')) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    setResendErr('');
    try {
      const { msg } = await authService.resendVerification(email);
      setResendMsg(msg);
    } catch (err) {
      const resp = err.response?.data;
      const msg =
        resp?.errors?.[0]?.msg || resp?.msg || err.message || 'Resend failed';
      setResendErr(msg);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Login to Mobile Appz</h2>

      {error && <p className={styles.error}>{error}</p>}

      {showResend && (
        <div className={styles.resendContainer}>
          <p>Didn't receive a verification email?</p>
          <button onClick={handleResend} className={styles.resendBtn}>
            Resend Verification Email
          </button>
          {resendMsg && <p className={styles.success}>{resendMsg}</p>}
          {resendErr && <p className={styles.error}>{resendErr}</p>}
        </div>
      )}

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
