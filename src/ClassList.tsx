import React, { useEffect, useState } from 'react';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

function ClassList() {
  const [classes, setClasses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Replace with Auth0/Clerk authentication check
    // Example: if (!isAuthenticated) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    // TODO: Fetch classes from Neon/Postgres
    // Example: fetch('/api/classes').then(...)
  }, []);

  const handleCreateClass = async () => {
    setShowModal(true);
  };

  const handleSaveClass = async () => {
    if (!newClassName.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/create-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName /*, teacher_id: ... */ }),
      });
      const data = await response.json();
      if (response.ok) {
        setSaving(false);
        setShowModal(false);
        setNewClassName('');
        navigate(`/classes/${data.id}`);
      } else {
        alert(data.error || 'Failed to create class');
        setSaving(false);
      }
    } catch (err) {
      alert('Network error');
      setSaving(false);
    }
  };

  const handleViewClass = (classId: string) => {
    navigate(`/classes/${classId}`);
  };

  const handleDeleteClass = async (classId: string) => {
    // TODO: Implement class deletion with Neon/Postgres
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
      {showModal && (
        <div style={modalStyles.overlay as React.CSSProperties}>
          <div style={modalStyles.modal as React.CSSProperties}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Class</h2>
            <input
              type="text"
              placeholder="Class Name"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              style={modalStyles.input as React.CSSProperties}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={modalStyles.cancelButton as React.CSSProperties} disabled={saving}>Cancel</button>
              <button onClick={handleSaveClass} style={modalStyles.saveButton as React.CSSProperties} disabled={saving || !newClassName.trim()}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}

const styles = {
  title: {
    fontSize: '2rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  newClassButton: {
    marginBottom: '1rem',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  } as React.CSSProperties,
  cardsWrapper: {
    display: 'flex',
    flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '1rem',
    minWidth: '250px',
    flex: '1 0 250px',
    display: 'flex',
    flexDirection: 'column' as React.CSSProperties['flexDirection'],
    justifyContent: 'space-between',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '1.2rem',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  cardDate: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as React.CSSProperties['flexDirection'],
    gap: '0.5rem',
  } as React.CSSProperties,
  viewButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
  } as React.CSSProperties,
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '2rem',
    minWidth: '320px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  input: {
    fontSize: '1.1rem',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #ccc',
    marginBottom: '0.5rem',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default ClassList;
