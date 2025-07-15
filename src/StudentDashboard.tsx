import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
// import { supabase } from './supabaseClient';

const StudentDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [tab, setTab] = useState<'current' | 'past'>('current');
  const navigate = useNavigate();

  // For demo: get class_id from localStorage or hardcode
  const classId = localStorage.getItem('studentClassId') || '';

  useEffect(() => {
    async function fetchAssignments() {
      if (!classId) {
        setAssignments([]);
        setLoading(false);
        return;
      }
      // TODO: Fetch assignments from Neon/Postgres for this classId
      setLoading(false);
    }
    fetchAssignments();
  }, [classId]);

  useEffect(() => {
    async function fetchSessions() {
      // TODO: Fetch study sessions from Neon/Postgres for this student
    }
    fetchSessions();
  }, []);

  // TODO: Add handlers for assignment actions as needed

  return (
    <StudentLayout>
      <h1>Student Dashboard</h1>
      {/* TODO: Render assignments and sessions from Neon/Postgres */}
      <div>
        {loading ? 'Loading...' : (
          <>
            <div>
              <button onClick={() => setTab('current')}>Current Assignments</button>
              <button onClick={() => setTab('past')}>Past Assignments</button>
            </div>
            {tab === 'current' ? (
              <div>
                {/* TODO: Render current assignments */}
                {assignments.length === 0 ? <p>No current assignments.</p> : <ul>{assignments.map(a => <li key={a.id}>{a.deck_id}</li>)}</ul>}
              </div>
            ) : (
              <div>
                {/* TODO: Render past sessions */}
                {sessions.length === 0 ? <p>No past sessions.</p> : <ul>{sessions.map(s => <li key={s.assignment_id}>{s.score_percent}%</li>)}</ul>}
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard; 