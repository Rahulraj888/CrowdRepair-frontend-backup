// src/pages/RegisterPage/RegisterPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [mobile, setMobile]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password & confirm match
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    // Mobile validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }

    // Password strength: min 6 chars, 1 uppercase, 1 lowercase, 1 digit
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!pwdRegex.test(password)) {
      setError(
        'Password must be at least 6 characters and include uppercase, lowercase, and a number'
      );
      return;
    }

    try {
      await authService.register({ name, email, mobile, password });
      setSuccess('Registration successful! Please verify your email before logging in.');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Create an Account</h2>

      {error && <p className={styles.error}>{error}</p>}

      {success && (
        <>
          <p className={styles.success}>{success}</p>
          <p className={styles.link}>
            Already verified? <Link to="/login">Log in here</Link>
          </p>
        </>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Mobile:
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              pattern="\d{10}"
              title="Enter exactly 10 digits"
              required
            />
          </label>

          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}"
              title="At least 6 characters, including uppercase, lowercase, and a number"
              required
            />
          </label>

          <label>
            Confirm Password:
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </label>

          <button type="submit">Register</button>
        </form>
      )}
    </div>
  );
}
