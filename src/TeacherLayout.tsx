import React from 'react';
import { Link } from 'react-router-dom';

function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.sidebar}>
        <h2>Teacher Panel</h2>
        <p><Link to="/teacher-home" style={styles.link}>My Decks</Link></p>
        <p><Link to="/classes" style={styles.link}>Classes</Link></p>
        <p><Link to="/assignments" style={styles.link}>Assignments</Link></p>
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
};

export default TeacherLayout;
