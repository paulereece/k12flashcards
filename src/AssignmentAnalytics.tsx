import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';

const AssignmentAnalytics = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [deckInfo, setDeckInfo] = useState<any>(null);

  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    // 1. Fetch assignment to get class_id, deck_id, due_date
    fetch(`/api/assignments/${assignmentId}`)
      .then(res => res.json())
      .then(assignment => {
        setAssignment(assignment);
        if (!assignment || !assignment.class_id || !assignment.deck_id) throw new Error('Assignment not found');
        setClassId(assignment.class_id);
        // Fetch class info
        fetch(`/api/classes/${assignment.class_id}`)
          .then(res => res.json())
          .then(classObj => setClassInfo(classObj));
        // Fetch deck info
        fetch(`/api/decks/${assignment.deck_id}`)
          .then(res => res.json())
          .then(deckObj => setDeckInfo(deckObj));
        // 2. Fetch students for class
        return fetch(`/api/classes/${assignment.class_id}/students`);
      })
      .then(res => res.json())
      .then(students => {
        setStudents(students);
        // 3. Fetch study sessions for assignment
        return fetch(`/api/study-sessions?assignment_id=${assignmentId}`);
      })
      .then(res => res.json())
      .then(sessions => {
        setSessions(sessions);
        setLoading(false);
      })
      .catch(() => { setStudents([]); setSessions([]); setLoading(false); });
  }, [assignmentId]);

  // Find most recent session for a student
  function getLatestSession(studentId: string) {
    const filtered = sessions.filter((s: any) => s.student_id === studentId);
    if (filtered.length === 0) return null;
    return filtered.reduce((latest: any, s: any) =>
      !latest || new Date(s.completed_at) > new Date(latest.completed_at) ? s : latest, null);
  }
  // Count number of attempts for a student
  function getNumAttempts(studentId: string) {
    return sessions.filter((s: any) => s.student_id === studentId).length;
  }

  return (
    <TeacherLayout>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Assignment Analytics</h1>
      {/* Elegant assignment/class info header */}
      {assignment && classInfo && deckInfo && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          padding: '1.1rem 1.5rem 1.1rem 1.5rem',
          marginBottom: '2.2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '2.5rem',
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.18rem', color: '#007bff', minWidth: 180 }}>
            {deckInfo.name}
          </div>
          <div style={{ color: '#555', fontSize: '1.08rem', minWidth: 160 }}>
            Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}
          </div>
          <div style={{ color: '#888', fontSize: '1.05rem', minWidth: 180 }}>
            Class: <span style={{ color: '#222', fontWeight: 600 }}>{classInfo.name}</span>
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ color: '#888', fontSize: '1.1rem', marginTop: '2rem' }}>Loading analytics...</div>
      ) : students.length === 0 ? (
        <div style={{ color: '#888', fontSize: '1.1rem', marginTop: '2rem' }}>No students found for this class.</div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '1.5rem',
        }}>
          {[...students].sort((a, b) => a.username.localeCompare(b.username)).map(student => {
            const session = getLatestSession(student.id);
            const numAttempts = getNumAttempts(student.id);
            return (
              <div key={student.id} style={{
                background: 'white',
                borderRadius: '7px',
                boxShadow: '0 0 4px rgba(0,0,0,0.07)',
                padding: '0.7rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e1e8ed',
                minHeight: 48,
                fontSize: '1.05rem',
                fontWeight: 500,
                gap: '2.5rem',
              }}>
                <div style={{ flex: 2, fontWeight: 700, fontSize: '1.08rem' }}>{student.username}</div>
                <div style={{ flex: 1, color: session ? '#007bff' : '#888', fontWeight: session ? 600 : 400, fontSize: '1.05rem' }}>
                  {session ? `Score: ${session.score_percent}%` : 'Not started'}
                </div>
                <div style={{ flex: 1, color: '#555', fontSize: '0.98rem' }}>
                  {session && session.completed_at ? `Completed: ${new Date(session.completed_at).toLocaleDateString()}` : ''}
                </div>
                <div style={{ flex: 1, color: '#888', fontSize: '0.98rem', textAlign: 'center' }}>
                  {numAttempts > 0 ? `Attempts: ${numAttempts}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={() => navigate(-1)} style={{ marginTop: '2.5rem', background: '#f5f8fa', color: '#007bff', border: '1px solid #c6d6e6', borderRadius: '6px', padding: '10px 28px', fontWeight: 600, fontSize: '1.08rem', cursor: 'pointer' }}>Back</button>
    </TeacherLayout>
  );
};

export default AssignmentAnalytics; 