import React, { useEffect, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function ClassList() {
  const [classes, setClasses] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('*');
      if (error) {
        console.error('Error fetching classes:', error.message);
      } else {
        setClasses(data);
      }
    };
    fetchClasses();
  }, []);

  const handleCreateClass = async () => {
    const name = prompt('Enter a class name:');
    if (!name) return;
    let code = '';
    while (!code) {
      code = prompt('Enter a unique class code (e.g., MATH2024):')?.trim() || '';
      if (!code) alert('Class code is required.');
    }
    const { data: session } = await supabase.auth.getUser();
    const teacherId = session.user?.id;
    if (!teacherId) {
      alert('Teacher not logged in.');
      return;
    }
    const { data, error } = await supabase
      .from('classes')
      .insert([{ name, code, teacher_id: teacherId }])
      .select()
      .single();
    if (error) {
      console.error('Error creating class:', error.message);
      alert('Could not create class. (Is the code unique?)');
    } else {
      setClasses((prev) => [...prev, data]);
    }
  };

  const handleViewClass = (classId: string) => {
    navigate(`/classes/${classId}`);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Delete this class? This cannot be undone.')) return;
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (!error) {
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    } else {
      alert('Error deleting class.');
    }
  };

  return (
    <TeacherLayout>
      <h1 style={styles.title}>My Classes</h1>
      <button style={styles.newClassButton} onClick={handleCreateClass}>New Class</button>
      <div style={styles.cardsWrapper}>
        {classes.map((c) => (
          <div key={c.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <strong style={styles.cardTitle}>{c.name}</strong>
                <p style={styles.cardDate}>
                  Created: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#333', margin: 0 }}>
                  <strong>Class Code:</strong> {c.code || '(none)'}
                </p>
              </div>
              <div style={styles.buttonGroup}>
                <button style={styles.viewButton} onClick={() => handleViewClass(c.id)}>
                  View
                </button>
                <button style={styles.deleteButton} onClick={() => handleDeleteClass(c.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {classes.length === 0 && <div style={{ color: '#888' }}>No classes yet.</div>}
      </div>
    </TeacherLayout>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  newClassButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    border: 'none',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  viewButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '8px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    border: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: '1rem',
    marginBottom: 0,
  },
  cardDate: {
    fontSize: '0.8rem',
    color: '#666',
    margin: 0,
  },
  cardsWrapper: {
    width: '100%',
    margin: 0,
    padding: 0,
  },
};

export default ClassList;
