import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';
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
      // TODO: Fetch class name from Neon/Postgres
      // TODO: Fetch students from Neon/Postgres
      setLoading(false);
    }
    if (classId) fetchClassAndStudents();
  }, [classId]);

  const handleAddStudent = async () => {
    if (!newStudent.username.trim() || !newStudent.password.trim()) return;
    // TODO: Implement student creation with Neon/Postgres and Auth0/Clerk
    // Example: call /api/add-student endpoint
  };

  const handleDeleteStudent = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Delete this student?')) return;
    // TODO: Implement student deletion with Neon/Postgres
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
        // TODO: Implement bulk student creation with Neon/Postgres and Auth0/Clerk
      }
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <TeacherLayout>
      <h2>Class: {className}</h2>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Username"
          value={newStudent.username}
          onChange={e => setNewStudent({ ...newStudent, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={newStudent.password}
          onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
        />
        <button onClick={handleAddStudent}>Add Student</button>
      </div>
      <input type="file" accept=".csv" onChange={handleImportCSV} />
      <table style={{ width: '100%', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Password</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>No students yet.</td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id || student.username}>
                <td>{student.username}</td>
                <td>{student.password}</td>
                <td>
                  <button onClick={() => handleDeleteStudent(student.id)}>Remove</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TeacherLayout>
  );
};

export default ClassDetails; 