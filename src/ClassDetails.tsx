import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import { supabase } from './supabaseClient';
import Papa from 'papaparse';

const ClassDetails: React.FC = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<{ id?: string; username: string; password: string }[]>([]);
  const [newStudent, setNewStudent] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClassAndStudents() {
      setLoading(true);
      // Get class name
      const { data: classData } = await supabase.from('classes').select('name').eq('id', classId).single();
      setClassName(classData?.name || '');
      // Get students
      const { data: studentData } = await supabase.from('students').select('id, username, password').eq('class_id', classId);
      setStudents(studentData || []);
      setLoading(false);
    }
    if (classId) fetchClassAndStudents();
  }, [classId]);

  const handleAddStudent = async () => {
    if (!newStudent.username.trim() || !newStudent.password.trim()) return;
    // Generate a fake email for Supabase Auth
    const email = `${newStudent.username}+${classId}@k12flashcards.local`;
    // Create Supabase Auth user (must be done from backend in production, but for demo we'll use signUp)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: newStudent.password,
    });
    if (authError || !authData?.user) {
      alert('Error creating student Auth user: ' + (authError?.message || 'Unknown error'));
      return;
    }
    const userId = authData.user.id;
    // Insert into students table
    const { data, error } = await supabase.from('students').insert([{ id: userId, username: newStudent.username, password: newStudent.password, class_id: classId }]).select().single();
    if (!error && data) {
      setStudents((prev) => [...prev, data]);
      setNewStudent({ username: '', password: '' });
    } else {
      alert('Error adding student to table.');
    }
  };

  const handleDeleteStudent = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this student?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      alert('Error deleting student.');
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !classId) return;
    Papa.parse(file, {
      complete: async (result: any) => {
        const data = result.data as string[][];
        const parsed = data
          .filter(row => row.length === 2 && row[0].trim() && row[1].trim())
          .map(([username, password]) => ({ username: username.trim(), password: password.trim() }));
        if (parsed.length === 0) {
          alert('No valid students found in CSV.');
          return;
        }
        const newStudents: any[] = [];
        for (const student of parsed) {
          const email = `${student.username}+${classId}@k12flashcards.local`;
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: student.password,
          });
          if (authError || !authData?.user) {
            alert(`Error creating Auth user for ${student.username}: ${authError?.message || 'Unknown error'}`);
            continue;
          }
          const userId = authData.user.id;
          const { data: studentData, error } = await supabase.from('students').insert([{ id: userId, username: student.username, password: student.password, class_id: classId }]).select().single();
          if (!error && studentData) {
            newStudents.push(studentData);
          } else {
            alert(`Error adding ${student.username} to students table.`);
          }
        }
        if (newStudents.length > 0) {
          setStudents((prev) => [...prev, ...newStudents]);
        }
      }
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <TeacherLayout>
      <button onClick={() => navigate('/classes')} style={styles.backButton}>&larr; Back to Classes</button>
      <h1 style={styles.title}>Class: {className}</h1>
      <div style={styles.addStudentRow}>
        <input
          type="text"
          placeholder="Username"
          value={newStudent.username}
          onChange={e => setNewStudent(s => ({ ...s, username: e.target.value }))}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Password"
          value={newStudent.password}
          onChange={e => setNewStudent(s => ({ ...s, password: e.target.value }))}
          style={styles.input}
        />
        <button onClick={handleAddStudent} style={styles.addButton}>Add Student</button>
        <label style={styles.importButton}>
          Import CSV
          <input type="file" accept=".csv" hidden onChange={handleImportCSV} />
        </label>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Username</th>
            <th style={styles.th}>Password</th>
            <th style={styles.th}>Remove</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id || student.username} style={styles.tr}>
              <td>{student.username}</td>
              <td>{student.password}</td>
              <td>
                <button style={styles.deleteButton} onClick={() => handleDeleteStudent(student.id)}>✕</button>
              </td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr><td colSpan={3} style={{ color: '#888', textAlign: 'center' }}>No students yet.</td></tr>
          )}
        </tbody>
      </table>
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
    fontSize: '2rem',
    marginBottom: '1.5rem',
  },
  addStudentRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    padding: '8px',
    fontSize: '1rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    minWidth: '120px',
  },
  addButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  importButton: {
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '1rem',
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-block',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  },
  th: {
    textAlign: 'left',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #eee',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default ClassDetails; 