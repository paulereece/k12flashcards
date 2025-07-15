import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';
import { useAuth0 } from '@auth0/auth0-react';

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.sub) return;
    setLoading(true);
    // Fetch assignments for this teacher
    fetch(`/api/assignments?teacher_id=${encodeURIComponent(user.sub)}`)
      .then(res => res.json())
      .then(async (data) => {
        // For each assignment, fetch deck and class info
        const withDetails = await Promise.all(data.map(async (a: any) => {
          const deckRes = await fetch(`/api/decks/${a.deck_id}`);
          const deck = deckRes.ok ? await deckRes.json() : { name: 'Unknown Deck' };
          const classRes = await fetch(`/api/classes/${a.class_id}`);
          const classObj = classRes.ok ? await classRes.json() : { name: 'Unknown Class' };
          return { ...a, deckName: deck.name, className: classObj.name };
        }));
        setAssignments(withDetails);
        setLoading(false);
      })
      .catch(() => { setAssignments([]); setLoading(false); });
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== id));
    } else {
      alert('Failed to delete assignment.');
    }
  };

  return (
    <TeacherLayout>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 700 }}>Assignments</h1>
      {loading ? (
        <div style={{ color: '#888', fontSize: '1.1rem', marginTop: '2rem' }}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div style={{ color: '#888', fontSize: '1.1rem', marginTop: '2rem' }}>No assignments yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {assignments.map(a => (
            <div key={a.id} style={{
              backgroundColor: 'white',
              borderRadius: '7px',
              boxShadow: '0 0 4px rgba(0,0,0,0.07)',
              padding: '0.7rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #e1e8ed',
              minHeight: 54,
              fontSize: '1.05rem',
              fontWeight: 500,
              justifyContent: 'space-between',
              gap: '1.2rem',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '1.08rem', fontWeight: 600, marginBottom: 2 }}>{a.deckName}</div>
                <span style={{ color: '#555', fontSize: '0.97rem', marginRight: 16 }}>Class: <span style={{ fontWeight: 500 }}>{a.className}</span></span>
                <span style={{ color: '#888', fontSize: '0.95rem' }}>Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                <button
                  style={{
                    background: '#f5f8fa',
                    color: '#007bff',
                    border: '1px solid #c6d6e6',
                    borderRadius: '6px',
                    padding: '7px 18px',
                    fontWeight: 600,
                    fontSize: '0.97rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => navigate(`/assignments/${a.id}/analytics`)}
                >
                  View Details
                </button>
                <button
                  style={{
                    background: '#fff0f0',
                    color: '#d9534f',
                    border: '1px solid #f5c6cb',
                    borderRadius: '6px',
                    padding: '7px 14px',
                    fontWeight: 600,
                    fontSize: '0.97rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => handleDelete(a.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherAssignments; 