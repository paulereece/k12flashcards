import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
// import { supabase } from './supabaseClient';

const StudentDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tab, setTab] = useState<'current' | 'past'>('current');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardTitle, setLeaderboardTitle] = useState('');
  const navigate = useNavigate();

  // For demo: get class_id from localStorage or hardcode
  const classId = localStorage.getItem('studentClassId') || '';
  const studentId = localStorage.getItem('studentId') || '';

  useEffect(() => {
    async function fetchAssignments() {
      if (!classId) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/assignments/class/${classId}`);
        const data = await response.json();
        if (response.ok) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
      } catch (err) {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, [classId]);

  useEffect(() => {
    async function fetchSessions() {
      if (!studentId) {
        setSessions([]);
        return;
      }
      try {
        const response = await fetch(`/api/study-sessions/student/${studentId}`);
        const data = await response.json();
        if (response.ok) {
          setSessions(data);
        } else {
          setSessions([]);
        }
      } catch (err) {
        setSessions([]);
      }
    }
    fetchSessions();
  }, [studentId]);

  // Leaderboard logic for a specific assignment
  async function openAssignmentLeaderboard(assignmentId: string, deckName: string) {
    // Fetch all sessions for this assignment
    const sessionsRes = await fetch(`/api/study-sessions?assignment_id=${assignmentId}`);
    const sessionsData = await sessionsRes.json();
    // Fetch all students for this class (for usernames)
    const studentsRes = await fetch(`/api/classes/${classId}/students`);
    const studentsData = await studentsRes.json();
    // Map studentId to username
    const studentMap: Record<string, string> = {};
    studentsData.forEach((s: any) => { studentMap[s.id] = s.username; });
    // Sort all sessions by score_percent descending, then by completed_at descending
    sessionsData.sort((a: any, b: any) => b.score_percent - a.score_percent || new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    // Top 5
    const top5 = sessionsData.slice(0, 5).map((s: any) => ({
      username: studentMap[s.student_id] || s.student_id,
      score: s.score_percent,
      date: s.completed_at ? new Date(s.completed_at).toLocaleDateString() : '',
      time: s.time_seconds || s.time || null,
    }));
    setLeaderboard(top5);
    setLeaderboardTitle(deckName);
    setShowLeaderboard(true);
  }

  // Helper to filter assignments by due date
  const today = new Date();
  today.setHours(0,0,0,0);
  const currentAssignments = assignments.filter(a => {
    if (!a.due_date) return true; // If no due date, treat as current
    const due = new Date(a.due_date);
    due.setHours(0,0,0,0);
    return due >= today;
  });
  const pastAssignments = assignments.filter(a => {
    if (!a.due_date) return false;
    const due = new Date(a.due_date);
    due.setHours(0,0,0,0);
    return due < today;
  });

  function getSessionForAssignment(assignmentId: string) {
    return sessions.find((s: any) => s.assignment_id === assignmentId);
  }

  return (
    <StudentLayout>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', marginTop: 0, textAlign: 'left' }}>My Assignments</h1>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
        <button
          style={{
            background: tab === 'current' ? '#007bff' : '#e0e0e0',
            color: tab === 'current' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1.5rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1.1rem',
            boxShadow: tab === 'current' ? '0 2px 8px rgba(0,123,255,0.08)' : 'none',
            transition: 'background 0.2s',
          }}
          onClick={() => setTab('current')}
        >
          Current
        </button>
        <button
          style={{
            background: tab === 'past' ? '#007bff' : '#e0e0e0',
            color: tab === 'past' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1.5rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1.1rem',
            boxShadow: tab === 'past' ? '0 2px 8px rgba(0,123,255,0.08)' : 'none',
            transition: 'background 0.2s',
          }}
          onClick={() => setTab('past')}
        >
          Past
        </button>
      </div>
      {loading ? (
        <div style={{ color: '#888', fontSize: '1.2rem' }}>(Loading...)</div>
      ) : (tab === 'current' ? currentAssignments : pastAssignments).length === 0 ? (
        <div style={{ color: '#888', fontSize: '1.2rem' }}>(No assignments yet.)</div>
      ) : (
        <div>
          {(tab === 'current' ? currentAssignments : pastAssignments).map(a => {
            const session = getSessionForAssignment(a.id);
            return (
              <div key={a.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={styles.cardTitle}>{a.deck_name || 'Deck'}</strong>
                    <p style={styles.cardDate}>
                      Assigned: {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}
                      {a.due_date && (
                        <span> | Due: {new Date(a.due_date).toLocaleDateString()}</span>
                      )}
                    </p>
                    {session && (
                      <p style={{ color: '#28a745', fontWeight: 500, margin: 0 }}>
                        Completed on: {session.completed_at ? new Date(session.completed_at).toLocaleDateString() : ''}
                        {typeof session.score_percent === 'number' && (
                          <> | Score: {session.score_percent}%</>
                        )}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <button
                      style={{
                        background: 'linear-gradient(90deg, #ffe066 0%, #ffd700 100%)',
                        color: '#ffd700',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        boxShadow: '0 2px 8px rgba(255,215,0,0.13)',
                        transition: 'background 0.2s',
                        margin: 0,
                        padding: 0,
                        cursor: 'pointer',
                      }}
                      title="Leaderboard"
                      onClick={() => openAssignmentLeaderboard(a.id, a.deck_name || 'Deck')}
                    >
                      <span role="img" aria-label="Leaderboard">🏆</span>
                    </button>
                    <button style={styles.studyButton} onClick={() => navigate(`/study/${a.deck_id}?assignmentId=${a.id}`)}>
                      {session && session.completed_at ? 'Try again' : 'Study'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.18)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '2.2rem 2.5rem',
            minWidth: 340,
            maxWidth: '90vw',
            textAlign: 'center',
          }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.2rem', color: '#ffd700', letterSpacing: 1 }}>Leaderboard</h2>
            <div style={{ fontWeight: 700, color: '#007bff', fontSize: '1.13rem', marginBottom: 8 }}>{leaderboardTitle}</div>
            {leaderboard.length === 0 ? (
              <div style={{ color: '#888', fontSize: '1.1rem' }}>(No scores yet.)</div>
            ) : (
              <ol style={{ textAlign: 'left', margin: '0 auto', maxWidth: 320 }}>
                {leaderboard.map((entry, i) => (
                  <li key={i} style={{ marginBottom: 10, fontSize: '1.08rem', fontWeight: 600, color: '#222' }}>
                    <span style={{ color: '#007bff', fontWeight: 700 }}>{entry.username}</span>
                    <span style={{ float: 'right', color: '#888', fontWeight: 500 }}>{entry.score}%</span>
                    <div style={{ fontSize: '0.97rem', color: '#888', fontWeight: 400, marginTop: 2 }}>
                      Date: {entry.date}
                      {entry.time !== undefined && entry.time !== null && (
                        <span style={{ marginLeft: 12, color: '#bfa600' }}>Time: {entry.time}s</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <button
              style={{
                marginTop: '1.5rem',
                background: '#ffe066',
                color: '#222',
                border: 'none',
                borderRadius: '6px',
                padding: '0.6rem 2.2rem',
                fontWeight: 700,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,215,0,0.13)',
              }}
              onClick={() => setShowLeaderboard(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)',
    marginBottom: '1.0rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '2rem',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: '1.1rem',
    marginBottom: 0,
    wordBreak: 'break-word',
  },
  cardDate: {
    fontSize: '0.85rem',
    color: '#666',
    margin: 0,
  },
  studyButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 22px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    border: 'none',
    fontWeight: 500,
    marginLeft: '1.5rem',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,123,255,0.08)',
    transition: 'background 0.2s',
  },
}; 