import React, { useEffect, useState } from 'react';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function ClassList() {
  const [classes, setClasses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth0();

  useEffect(() => {
    // TODO: Replace with Auth0/Clerk authentication check
    // Example: if (!isAuthenticated) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    // Try to load cached classes first
    const cached = localStorage.getItem('classListCache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setClasses(parsed.classes || []);
        setLoading(false);
      } catch {}
    }
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
        // Cache the result
        localStorage.setItem('classListCache', JSON.stringify({ classes: data, ts: Date.now() }));
      } else {
        console.error('Failed to fetch classes');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    setShowModal(true);
  };

  const handleSaveClass = async () => {
    if (!newClassName.trim()) return;
    if (!user || !user.sub || !user.email) {
      alert('Could not determine teacher id or email. Please log in again.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/create-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, teacher_id: user.sub, teacher_email: user.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSaving(false);
        setShowModal(false);
        setNewClassName('');
        fetchClasses(); // Refresh the classes list
        // Invalidate cache
        localStorage.removeItem('classListCache');
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
        {loading ? (
          <div style={styles.loadingMessage}>Loading classes...</div>
        ) : (
          <>
            {classes.map((c) => (
              <div key={c.id} style={styles.card} onClick={() => handleViewClass(c.id)}>
                <div style={styles.cardHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.cardTitle}>{c.name}</div>
                    <div style={styles.cardDate}>
                      Created: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={styles.cardCode}>
                      <strong>Class Code:</strong> {c.code || '(none)'}
                    </div>
                  </div>
                  <div style={styles.buttonGroup}>
                    <button 
                      style={styles.viewButton} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClass(c.id);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      style={styles.deleteButton} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(c.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {classes.length === 0 && <div style={{ color: '#888' }}>No classes yet.</div>}
          </>
        )}
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
    marginBottom: '1.5rem',
    color: '#2c3e50',
    fontWeight: '600',
  } as React.CSSProperties,
  newClassButton: {
    marginBottom: '1.5rem',
    padding: '0.6rem 1.2rem',
    fontSize: '1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(52, 152, 219, 0.3)',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  cardsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0',
    maxWidth: '100%',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
    padding: '1rem',
    border: '1px solid #e1e8ed',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    width: '100%',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '0.25rem',
    color: '#2c3e50',
    fontWeight: '600',
  } as React.CSSProperties,
  cardDate: {
    fontSize: '0.85rem',
    color: '#7f8c8d',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  cardCode: {
    fontSize: '0.85rem',
    color: '#34495e',
    marginBottom: '0',
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  } as React.CSSProperties,
  viewButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.4rem 0.8rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  } as React.CSSProperties,
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.4rem 0.8rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
  } as React.CSSProperties,
  loadingMessage: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '1rem',
    padding: '2rem',
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
