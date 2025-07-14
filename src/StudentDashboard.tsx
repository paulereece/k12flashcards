import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import { supabase } from './supabaseClient';

const StudentDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tab, setTab] = useState<'current' | 'past'>('current');
  const navigate = useNavigate();

  // For demo: get class_id from localStorage or hardcode
  const classId = localStorage.getItem('studentClassId') || '';

  useEffect(() => {
    async function fetchAssignments() {
      if (!classId) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('assignments')
        .select('id, deck_id, decks ( name ), created_at, due_date')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (!error && data) setAssignments(data);
      setLoading(false);
    }
    fetchAssignments();
  }, [classId]);

  useEffect(() => {
    async function fetchSessions() {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('assignment_id, completed_at, score_percent')
        .eq('student_id', (await supabase.auth.getUser()).data.user?.id);
      if (!error && data) setSessions(data);
    }
    fetchSessions();
  }, []);

  function getSessionForAssignment(assignmentId: string) {
    return sessions.find((s: any) => s.assignment_id === assignmentId);
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
                    <strong style={styles.cardTitle}>{a.decks?.name || 'Deck'}</strong>
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
                  <button style={styles.studyButton} onClick={() => navigate(`/study/${a.deck_id}?assignmentId=${a.id}`)}>
                    {session && session.completed_at ? 'Try again' : 'Study'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    backgroundColor: 'white',
    padding: '1rem', // more horizontal padding
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)',
    marginBottom: '1.0rem', // more space between cards
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '2rem', // add space between text and button
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
    padding: '10px 22px', // larger button
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    border: 'none',
    fontWeight: 500,
    marginLeft: '1.5rem', // extra space from text
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,123,255,0.08)',
    transition: 'background 0.2s',
  },
};

export default StudentDashboard; 