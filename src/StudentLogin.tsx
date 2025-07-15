import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { supabase } from './supabaseClient';
// import { getClassIdByCode } from './supabasehelpers';

const StudentLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, classCode }),
      });
      const data = await response.json();
      if (response.ok) {
        // Store student id and class_id in localStorage
        localStorage.setItem('studentId', data.id);
        localStorage.setItem('studentClassId', data.class_id);
        navigate('/student-dashboard');
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.box}>
        <h2 style={styles.title}>Student Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Class Code"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            autoComplete="off"
          />
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f8f9fa',
  },
  box: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '2.5rem 2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    minWidth: '340px',
    maxWidth: '90vw',
  },
  title: {
    marginBottom: '1.5rem',
    fontSize: '2rem',
    fontWeight: 700,
    color: '#212529',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  input: {
    padding: '0.85rem',
    fontSize: '1.05rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: 0,
    background: '#f6f8fa',
    outline: 'none',
    transition: 'border 0.2s',
  },
  button: {
    padding: '0.85rem',
    fontSize: '1.1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'background 0.2s',
  },
  error: {
    color: 'red',
    marginTop: '0.5rem',
    fontSize: '0.95rem',
    textAlign: 'center',
  },
};

export default StudentLogin; 