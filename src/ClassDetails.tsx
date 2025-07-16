import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';

const ClassDetails: React.FC = () => {
  const { classId } = useParams();
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<{ username: string; password: string }[]>([]);
  const [newStudent, setNewStudent] = useState({ username: '', password: '' });
  const [editingName, setEditingName] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    async function fetchClass() {
      setLoading(true);
      try {
        const res = await fetch(`/api/classes/${classId}`);
        if (res.ok) {
          const data = await res.json();
          setClassName(data.name || 'Untitled Class');
        } else {
          setClassName('Untitled Class');
        }
      } catch (e) {
        setClassName('Untitled Class');
      }
      setLoading(false);
    }
    fetchClass();
    // Fetch students for this class
    async function fetchStudents() {
      try {
        const res = await fetch(`/api/classes/${classId}/students`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        } else {
          setStudents([]);
        }
      } catch (e) {
        setStudents([]);
      }
    }
    fetchStudents();
  }, [classId]);

  const handleAddStudent = async () => {
    if (!newStudent.username.trim() || !newStudent.password.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newStudent.username,
          password: newStudent.password,
          class_id: classId,
        })
      });
      if (res.ok) {
        setStudents([...students, { ...newStudent }]);
        setNewStudent({ username: '', password: '' });
      } else {
        alert('Failed to add student.');
      }
    } catch (e) {
      alert('Error adding student.');
    }
    setAdding(false);
  };

  const handleRemoveStudent = (idx: number) => {
    // TODO: Send DELETE to /api/classes/:id/students/:studentId
    setStudents(students.filter((_, i) => i !== idx));
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Parse CSV and send POST for each student
    alert('CSV import not implemented yet.');
  };

  const handleEditClick = () => {
    setNewClassName(className);
    setEditingName(true);
  };

  const handleSaveClassName = async () => {
    if (!newClassName.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim() })
      });
      if (res.ok) {
        setClassName(newClassName.trim());
        setEditingName(false);
      } else {
        alert('Failed to update class name.');
      }
    } catch (e) {
      alert('Error updating class name.');
    }
    setSavingName(false);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <TeacherLayout>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 700,
        margin: '2.5rem auto',
        padding: '2.5rem 2rem',
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        border: '1.5px solid #e5e7eb',
        minHeight: 400,
      }}>
        <Link to="/classes" style={{ color: '#2d5be3', textDecoration: 'underline', fontWeight: 500, marginBottom: 8, fontSize: '1rem', alignSelf: 'flex-start' }}>&larr; Back to Classes</Link>
        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          {editingName ? (
            <>
              <input
                type="text"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                style={{ fontSize: '1.1rem', padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid #d1d5db', marginRight: 8 }}
                autoFocus
              />
              <button onClick={handleSaveClassName} disabled={savingName} style={{ background: '#2ecc40', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.98rem', cursor: savingName ? 'not-allowed' : 'pointer', marginRight: 6 }}>
                {savingName ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingName(false)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 500, fontSize: '0.98rem', cursor: 'pointer' }}>Cancel</button>
            </>
          ) : (
            <>
              <span>Class: {className || 'Untitled Class'}</span>
              <button onClick={handleEditClick} style={{ background: 'none', color: '#2d5be3', border: 'none', borderRadius: 6, padding: '0.3rem 0.8rem', fontWeight: 500, fontSize: '1rem', cursor: 'pointer', marginLeft: 8, textDecoration: 'underline' }}>Edit</button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 0, alignItems: 'flex-start' }}>
          <input
            type="text"
            placeholder="Username"
            value={newStudent.username}
            onChange={e => setNewStudent({ ...newStudent, username: e.target.value })}
            style={{ flex: 1, fontSize: '0.98rem', padding: '0.5rem 0.8rem', borderRadius: 6, border: '1px solid #d1d5db', outline: 'none', background: '#f8f9fa', transition: 'border 0.2s' }}
          />
          <input
            type="text"
            placeholder="Password"
            value={newStudent.password}
            onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
            style={{ flex: 1, fontSize: '0.98rem', padding: '0.5rem 0.8rem', borderRadius: 6, border: '1px solid #d1d5db', outline: 'none', background: '#f8f9fa', transition: 'border 0.2s' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 130 }}>
            <button
              onClick={handleAddStudent}
              disabled={adding}
              style={{ background: '#2ecc40', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 0', fontWeight: 600, fontSize: '0.98rem', cursor: adding ? 'not-allowed' : 'pointer', width: '100%', height: 44, minWidth: 120 }}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.2rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem', fontWeight: 700, fontSize: '1rem', color: '#222' }}>Username</th>
              <th style={{ textAlign: 'left', padding: '0.5rem 0.4rem', fontWeight: 700, fontSize: '1rem', color: '#222' }}>Password</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={idx}>
                <td style={{ padding: '0.5rem 0.4rem' }}>{student.username}</td>
                <td style={{ padding: '0.5rem 0.4rem', position: 'relative' }}>
                  {student.password}
                  <button
                    onClick={() => handleRemoveStudent(idx)}
                    style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, width: 28, height: 28, fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 10, verticalAlign: 'middle' }}
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TeacherLayout>
  );
};

export default ClassDetails; 