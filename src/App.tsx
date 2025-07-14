import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Link } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-home" element={<TeacherHome />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/study/:deckId" element={<StudyViewWrapper />} />
        <Route path="/classes" element={<ClassList />} />
        <Route path="/classes/:classId" element={<ClassDetails />} />
        <Route path="/decks/:deckId/edit" element={<EditDeck />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/assignments" element={<TeacherAssignments />} />
        <Route path="/assignments/:assignmentId/analytics" element={<AssignmentAnalytics />} />
      </Routes>
    </Router>
  );
}

const StudyViewWrapper = () => {
  const { deckId } = useParams();
  return <StudyView deckId={deckId!} />;
};

function Home() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>K12 Flashcards</h1>
        <div style={styles.buttonContainer}>
          <Link to="/teacher-login" style={{ textDecoration: 'none' }}>
            <button style={styles.button}>Teacher Login</button>
          </Link>
          <Link to="/student-login" style={{ textDecoration: 'none' }}>
            <button style={styles.button}>Student Login</button>
          </Link>
        </div>
      </div>
    </div>
  );
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
  },
  button: {
    fontSize: '1.25rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default App;
