import React, { useEffect, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { supabase } from './supabaseClient';

const TeacherAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      // Get current teacher's id
      const { data: userData } = await supabase.auth.getUser();
      const teacherId = userData?.user?.id;
      if (!teacherId) return;
      // Fetch assignments with deck and class info
      const { data, error } = await supabase
        .from('assignments')
        .select('id, created_at, deck_id, class_id, decks ( name ), classes ( name )')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });
      if (!error && data) setAssignments(data);
      setLoading(false);
    }
    fetchAssignments();
  }, []);

  async function handleDelete(assignmentId: string) {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
    if (!error) setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    else alert('Error deleting assignment.');
  }

  return (
    <TeacherLayout>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '2rem' }}>Assignments</h1>
      {loading ? (
        <div style={{ color: '#888', fontSize: '1.2rem' }}>(Loading...)</div>
      ) : assignments.length === 0 ? (
        <div style={{ color: '#888', fontSize: '1.2rem' }}>(No assignments yet.)</div>
      ) : (
        <div>
          {assignments.map(a => (
            <div key={a.id} style={{ background: 'white', borderRadius: 8, boxShadow: '0 0 5px rgba(0,0,0,0.08)', padding: '1rem 1.5rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{a.decks?.name || 'Deck'}</div>
                <div style={{ color: '#555', fontSize: '0.98rem' }}>Class: {a.classes?.name || a.class_id}</div>
                <div style={{ color: '#888', fontSize: '0.95rem' }}>Assigned: {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
              <button onClick={() => handleDelete(a.id)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherAssignments; 