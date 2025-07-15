import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch assignments from Neon/Postgres
    setLoading(false);
  }, []);

  // TODO: Add handlers for assignment actions as needed

  return (
    <TeacherLayout>
      <h1>Assignments</h1>
      {/* TODO: Render assignments from Neon/Postgres */}
      {loading ? (
        <div>Loading...</div>
      ) : assignments.length === 0 ? (
        <div>No assignments yet.</div>
      ) : (
        <ul>
          {assignments.map(a => (
            <li key={a.id}>{a.deck_id}</li>
          ))}
        </ul>
      )}
    </TeacherLayout>
  );
};

export default TeacherAssignments; 