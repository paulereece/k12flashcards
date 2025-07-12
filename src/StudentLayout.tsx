import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const sidebarStyle: React.CSSProperties = {
  width: '260px',
  height: '100vh',
  background: '#e3f0fb', // lighter blue
  color: '#212529',
  display: 'flex',
  flexDirection: 'column',
  padding: '1.25rem 1.5rem 1.5rem 1.5rem', // less top padding
  fontWeight: 500,
  fontSize: '1.15rem',
  position: 'fixed',
  left: 0,
  top: 0,
};

const mainStyle: React.CSSProperties = {
  flex: 1, // allow main to stretch and fill space
  marginLeft: '260px',
  padding: '1.5rem 2rem 2.5rem 2rem', // less top padding
  minHeight: '100vh',
  background: '#f8f9fa',
};

const navItemStyle: React.CSSProperties = {
  marginBottom: '2rem',
  textDecoration: 'none',
  color: '#212529',
  fontWeight: 600,
  fontSize: '1.15rem',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
};

const activeNavItemStyle: React.CSSProperties = {
  ...navItemStyle,
  color: '#007bff',
};

const StudentLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div style={{ display: 'flex' }}>
      <aside style={sidebarStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem', marginTop: 0 }}>Student Panel</h2>
        <Link
          to="/student-dashboard"
          style={location.pathname === '/student-dashboard' ? activeNavItemStyle : navItemStyle}
        >
          My Assignments
        </Link>
      </aside>
      <main style={mainStyle}>{children}</main>
    </div>
  );
};

export default StudentLayout; 