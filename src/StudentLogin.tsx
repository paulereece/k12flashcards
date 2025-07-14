import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { getClassIdByCode } from './supabasehelpers';

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

    // 1. Look up class UUID by code
    const { id: classId, error: classError } = await getClassIdByCode(classCode.trim());
    if (classError || !classId) {
      setError('Invalid class code.');
      setLoading(false);
      return;
    }
    // 2. Construct fake email
    const email = `${username}+${classId}@k12flashcards.local`;
    // 3. Try to log in with Supabase Auth
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError('Invalid username or password.');
    } else {
      localStorage.setItem('studentClassId', classId); // Store classId for assignment fetching
      navigate('/student-dashboard');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>Student Login</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Class Code"
            value={classCode}
            onChange={e => setClassCode(e.target.value)}
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.loginButton} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
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
  container: {
    textAlign: 'center',
    background: 'white',
    padding: '2.5rem 2rem',
    borderRadius: '12px',
    boxShadow: '0 0 12px rgba(0,0,0,0.08)',
    minWidth: '320px',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#212529',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  input: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    outline: 'none',
  },
  loginButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '1.1rem',
    cursor: 'pointer',
    fontWeight: 500,
  },
  error: {
    color: '#dc3545',
    fontSize: '1rem',
    marginBottom: '-0.5rem',
  },
};

export default StudentLogin; 