import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './VerifyEmailPage.module.css';

export default function VerifyEmailPage() {
  const [status, setStatus]     = useState('loading');  // 'loading' | 'success' | 'error'
  const [message, setMessage]   = useState('');
  const [email, setEmail]       = useState('');
  const [resendMsg, setResend]  = useState('');
  const [resendErr, setResendErr] = useState('');
  const calledOnce = useRef(false);
  const token = new URLSearchParams(useLocation().search).get('token');

  useEffect(() => {
    if (calledOnce.current) return;
    calledOnce.current = true;

    (async () => {
      try {
        await authService.verifyEmail(token);
        setMessage('Email successfully verified! You can now log in.');
        setStatus('success');
      } catch (err) {
        const errMsg =
          err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.msg ||
          err.message ||
          'Token is invalid or expired.';
        setMessage(errMsg);
        setStatus('error');
      }
    })();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResend('');
    setResendErr('');
    try {
      const { msg } = await authService.resendVerification(email);
      setResend(msg);
    } catch (err) {
      setResendErr(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.msg ||
        err.message
      );
    }
  };

  return (
    <div className={styles.container}>
      <h2>Email Verification</h2>

      {status === 'loading' && (
        <p className={styles.info}>Verifying…</p>
      )}

      {status === 'success' && (
        <p className={styles.success}>{message}</p>
      )}

      {status === 'error' && (
        <p className={styles.error}>{message}</p>
      )}

      <Link to="/login" className={styles.link}>
        Go to Login
      </Link>

      {status === 'error' && message.toLowerCase().includes('expired') && (
        <form onSubmit={handleResend} className={styles.form}>
          <p>Enter your email to resend verification:</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit">Resend Email</button>
          {resendMsg && <p className={styles.success}>{resendMsg}</p>}
          {resendErr && <p className={styles.error}>{resendErr}</p>}
        </form>
      )}
    </div>
  );
}
