import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { NiletronLogo } from './NiletronLogo.jsx';
import styles from './Auth.module.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true, state: { welcomeToast: 'login' } });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <NiletronLogo variant="auth" />
        <p className={styles.subtitle}>Smart Home Automation</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className={styles.footer}>
          No account? <Link to="/register">Register</Link>
        </p>
        <p className={styles.footer}>
          <button
            type="button"
            className={styles.clearLink}
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              if (window.location.pathname === '/login') {
                window.location.reload();
              } else {
                window.location.replace('/login');
              }
            }}
          >
            Clear local data
          </button>
        </p>
      </div>
    </div>
  );
}
