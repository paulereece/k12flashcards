import { Client } from 'pg';

export default async function handler(req, res) {
  const { method, query, body } = req;
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    // GET /api/study-sessions/student/:studentId
    if (method === 'GET' && query.studentId) {
      const { studentId } = query;
      const result = await client.query(
        `SELECT id, assignment_id, score_percent, completed_at
         FROM study_sessions
         WHERE student_id = $1
         ORDER BY completed_at DESC`,
        [studentId]
      );
      return res.status(200).json(result.rows);
    }
    // GET /api/study-sessions (by assignment_id)
    if (method === 'GET' && query.assignment_id) {
      const { assignment_id } = query;
      const result = await client.query(
        'SELECT * FROM study_sessions WHERE assignment_id = $1 ORDER BY completed_at DESC',
        [assignment_id]
      );
      return res.status(200).json(result.rows);
    }
    // POST /api/study-sessions
    if (method === 'POST') {
      const { assignment_id, student_id, score_percent, time_seconds } = body;
      if (!assignment_id || !student_id || typeof score_percent !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const result = await client.query(
        `INSERT INTO study_sessions (assignment_id, student_id, score_percent, completed_at, created_at, time_seconds)
         VALUES ($1, $2, $3, NOW(), NOW(), $4) RETURNING id, assignment_id, student_id, score_percent, completed_at, time_seconds`,
        [assignment_id, student_id, score_percent, time_seconds || null]
      );
      return res.status(200).json(result.rows[0]);
    }
    // If no route matched
    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    await client.end();
  }
} 