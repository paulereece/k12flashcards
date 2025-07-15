import React from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import TeacherHome from './TeacherHome';
import TeacherLogin from './TeacherLogin';
import UpdatePassword from './UpdatePassword';
import StudyView from './StudyView';
import ClassList from './ClassList';
import EditDeck from './EditDeck';
import ClassDetails from './ClassDetails';
import StudentLogin from './StudentLogin';
import StudentDashboard from './StudentDashboard';
import TeacherAssignments from './TeacherAssignments';
import AssignmentAnalytics from './AssignmentAnalytics';

const AUTH0_DOMAIN = 'dev-lzi06n7eqwrmk6sf.us.auth0.com';
const AUTH0_CLIENT_ID = 'hGbi2z9wROo0kvRzjQG8SpwvG2c931eY';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return null; // or a loading spinner
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/study/:deckId" element={<StudyViewWrapper />} />
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />

          {/* Protected teacher routes */}
          <Route path="/teacher-home" element={<ProtectedRoute><TeacherHome /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><ClassList /></ProtectedRoute>} />
          <Route path="/classes/:classId" element={<ProtectedRoute><ClassDetails /></ProtectedRoute>} />
          <Route path="/assignments" element={<ProtectedRoute><TeacherAssignments /></ProtectedRoute>} />
          <Route path="/assignments/:assignmentId/analytics" element={<ProtectedRoute><AssignmentAnalytics /></ProtectedRoute>} />
          <Route path="/decks/:deckId/edit" element={<ProtectedRoute><EditDeck /></ProtectedRoute>} />
        </Routes>
      </Router>
    </Auth0Provider>
  );
}

function Home() {
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/teacher-home');
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>K12 Flashcards</h1>
        <div style={styles.buttonContainer}>
          <button
            style={styles.button}
            onClick={() => loginWithRedirect()}
            disabled={isLoading}
          >
            Teacher Login
          </button>
          <button
            style={styles.button}
            onClick={() => navigate('/student-login')}
          >
            Student Login
          </button>
        </div>
        <p style={{ color: '#888', marginTop: '2rem' }}>
          Welcome to the flashcard platform for teachers and students.
        </p>
      </div>
    </div>
  );
}

function StudyViewWrapper() {
  const { deckId } = useParams();
  return <StudyView deckId={deckId!} />;
}

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
  },
  title: {
    fontSize: '3rem',
    marginBottom: '2rem',
    color: '#212529',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '4rem',
    marginBottom: '2rem',
  },
  button: {
    fontSize: '1.25rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    minWidth: '180px',
    fontWeight: 600,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'background 0.2s',
  },
};

export default App;
