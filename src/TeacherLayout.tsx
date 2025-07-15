import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth0();
  return (
    <div style={styles.wrapper}>
      <div style={styles.sidebar}>
        <h2>Teacher Panel</h2>
        <p><Link to="/teacher-home" style={styles.link}>My Decks</Link></p>
        <p><Link to="/classes" style={styles.link}>Classes</Link></p>
        <p><Link to="/assignments" style={styles.link}>Assignments</Link></p>
        <button
          style={styles.logoutButton}
          onClick={() => logout({ returnTo: window.location.origin } as any)}
        >
          Log Out
        </button>
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    height: '100vh',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '1rem',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1rem',
    margin: '0.75rem 0',
    display: 'inline-block',
  },
  content: {
    flex: 1,
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    overflowY: 'auto',
  },
  logoutButton: {
    position: 'absolute',
    bottom: '1rem',
    left: '1rem',
    backgroundColor: '#34495e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    opacity: 0.85,
  },
};

export default TeacherLayout;
