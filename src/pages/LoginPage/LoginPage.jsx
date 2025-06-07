// src/pages/LoginPage/LoginPage.jsx
import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import { AuthContext } from '../../context/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate                = useNavigate();
  const { setUser }             = useContext(AuthContext);  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { token } = await authService.login(email, password);
      localStorage.setItem('token', token);
      console.log("logs for login page")
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);

      navigate('/dashboard');
    } catch (err) {
      let errorMessage = err.message || 'Login failed';
      if (err.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data.errors) && data.errors[0]?.msg) {
          errorMessage = data.errors[0].msg;
        } else if (data.msg) {
          errorMessage = data.msg;
        } 
      } 
      setError(errorMessage)
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
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
