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

    // TODO: Look up class UUID by code from Neon/Postgres
    // TODO: Implement login with Auth0/Clerk or custom Neon/Postgres auth
    // On success: localStorage.setItem('studentClassId', classId); navigate('/student-dashboard');
    // On error: setError('Invalid username or password.');
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.box}>
        <h2 style={styles.title}>Student Login</h2>
        <form onSubmit={handleLogin}>
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
    gap: '1rem',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    minWidth: '300px',
  },
  title: {
    marginBottom: '1rem',
    fontSize: '1.5rem',
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '0.5rem',
  },
  button: {
    padding: '0.75rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginTop: '0.5rem',
    fontSize: '0.9rem',
  },
};

export default StudentLogin; 