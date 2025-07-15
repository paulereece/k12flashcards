import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
// import { supabase } from './supabaseClient';

const AssignmentAnalytics = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch assignment analytics from Neon/Postgres
    setLoading(false);
  }, [assignmentId]);

  return (
    <TeacherLayout>
      <h1>Assignment Analytics</h1>
      {/* TODO: Render analytics from Neon/Postgres */}
      {loading ? (
        <div>Loading...</div>
      ) : !analytics ? (
        <div>No analytics available.</div>
      ) : (
        <pre>{JSON.stringify(analytics, null, 2)}</pre>
      )}
      <button onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Back</button>
    </TeacherLayout>
  );
};

export default AssignmentAnalytics; 