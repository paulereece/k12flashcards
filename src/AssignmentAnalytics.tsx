import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import { supabase } from './supabaseClient';

type StudentResult = {
  id: string;
  username: string;
  score_percent: number | null;
  completed_at: string | null;
};

const AssignmentAnalytics: React.FC = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignmentData() {
      if (!assignmentId) return;
      try {
        // Get assignment details with deck and class info
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('assignments')
          .select(`
            id,
            created_at,
            deck_id,
            class_id,
            decks (name),
            classes (name)
          `)
          .eq('id', assignmentId)
          .single();
        if (assignmentError) {
          console.error('Error fetching assignment:', assignmentError);
          alert('Error loading assignment data.');
          return;
        }
        setAssignment(assignmentData);

        // 1. Get all students in the class
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id, username')
          .eq('class_id', assignmentData.class_id);
        if (studentsError) {
          console.error('Error fetching students:', studentsError);
          alert('Error loading students.');
          return;
        }
        // 2. Get all study sessions for this assignment
        const { data: sessions, error: sessionsError } = await supabase
          .from('study_sessions')
          .select('student_id, score_percent, completed_at')
          .eq('assignment_id', assignmentId);
        if (sessionsError) {
          console.error('Error fetching study sessions:', sessionsError);
          alert('Error loading student results.');
          return;
        }
        // 3. Merge: for each student, find their session (if any)
        const results: StudentResult[] = students.map((student: any) => {
          const session = sessions.find((s: any) => s.student_id === student.id);
          return {
            id: student.id,
            username: student.username,
            score_percent: session ? session.score_percent : null,
            completed_at: session ? session.completed_at : null,
          };
        });
        // 4. Sort alphabetically by username
        results.sort((a, b) => a.username.localeCompare(b.username));
        setStudentResults(results);
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while loading the data.');
      } finally {
        setLoading(false);
      }
    }
    fetchAssignmentData();
  }, [assignmentId]);

  if (loading) {
    return (
      <TeacherLayout>
        <div style={{ color: '#888', fontSize: '1.2rem' }}>Loading assignment data...</div>
      </TeacherLayout>
    );
  }
  if (!assignment) {
    return (
      <TeacherLayout>
        <div style={{ color: '#dc3545', fontSize: '1.2rem' }}>Assignment not found.</div>
      </TeacherLayout>
    );
  }
  return (
    <TeacherLayout>
      <button 
        onClick={() => navigate('/assignments')} 
        style={styles.backButton}
      >
        &larr; Back to Assignments
      </button>
      <h1 style={styles.title}>Assignment Analytics</h1>
      <div style={styles.assignmentInfo}>
        <h2 style={styles.subtitle}>{assignment.decks?.name || 'Deck'}</h2>
        <p style={styles.infoText}>
          <strong>Class:</strong> {assignment.classes?.name || assignment.class_id}
        </p>
        <p style={styles.infoText}>
          <strong>Assigned:</strong> {assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : 'N/A'}
        </p>
        <p style={styles.infoText}>
          <strong>Students in Class:</strong> {studentResults.length}
        </p>
      </div>
      {studentResults.length === 0 ? (
        <div style={styles.noResults}>
          <p>No students in this class.</p>
        </div>
      ) : (
        <div style={styles.resultsContainer}>
          <h3 style={styles.resultsTitle}>Student Results (Alphabetical Order)</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Completed</th>
                </tr>
              </thead>
              <tbody>
                {studentResults.map((student) => (
                  <tr key={student.id} style={styles.tr}>
                    <td style={styles.td}>{student.username}</td>
                    <td style={styles.td}>
                      {student.score_percent !== null ? (
                        <span style={{
                          color: student.score_percent >= 80 ? '#28a745' : 
                                 student.score_percent >= 60 ? '#ffc107' : '#dc3545',
                          fontWeight: 600
                        }}>
                          {student.score_percent}%
                        </span>
                      ) : (
                        <span style={{ color: '#888' }}>N/A</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {student.completed_at ? new Date(student.completed_at).toLocaleDateString() : <span style={{ color: '#888' }}>N/A</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.summary}>
            <p><strong>Average Score (Completed Only):</strong> {
              studentResults.filter(s => s.score_percent !== null).length > 0
                ? Math.round(studentResults.filter(s => s.score_percent !== null).reduce((sum, s) => sum + (s.score_percent || 0), 0) / studentResults.filter(s => s.score_percent !== null).length)
                : 0
            }%</p>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backButton: {
    marginBottom: '1rem',
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '1rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '2rem',
    color: '#212529',
  },
  assignmentInfo: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
  },
  subtitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#212529',
  },
  infoText: {
    fontSize: '1rem',
    color: '#555',
    margin: '0.5rem 0',
  },
  noResults: {
    background: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.08)',
    textAlign: 'center',
    color: '#888',
  },
  resultsContainer: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.08)',
  },
  resultsTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    color: '#212529',
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '1.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '2px solid #eee',
    fontWeight: 600,
    color: '#212529',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  td: {
    padding: '0.75rem',
    fontSize: '1rem',
  },
  summary: {
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '6px',
    borderTop: '1px solid #eee',
  },
};

export default AssignmentAnalytics; 