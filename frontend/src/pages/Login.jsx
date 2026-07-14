import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Theme toggle — top right corner */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{
          position: 'absolute', top: '1.25rem', right: '1.5rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '20px', padding: '0.3rem 0.75rem',
          cursor: 'pointer', fontSize: '1rem', color: 'var(--text-bright)'
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="card" style={styles.card}>
        <h2 style={styles.title}>Log in to TMS</h2>
        <p style={styles.subtitle}>Enter your credentials to continue.</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <button type="submit" style={styles.button}>Log In</button>
        </form>
      </div>
    </div>
  );
};

// Inline styles for the Login page specifically
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    position: 'relative',
    backgroundColor: 'var(--bg-main)',
  },
  card: {
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    color: 'var(--text-bright)',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
  error: {
    backgroundColor: 'rgba(255, 86, 48, 0.1)',
    color: '#FF5630',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
    width: '100%',
    textAlign: 'center',
    fontSize: '0.9rem',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: 'var(--text-main)',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-bright)',
    outline: 'none',
    fontFamily: 'inherit',
  },
  button: {
    marginTop: '1rem',
    padding: '0.75rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'var(--accent-blue)',
    color: '#1D2125',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
};

export default Login;
