import { Client } from 'pg';

export default async function handler(req, res) {
  const { method, body } = req;
  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password, classCode } = body;
  if (!username || !password || !classCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // Look up class_id from classCode
    const classResult = await client.query('SELECT id FROM classes WHERE code = $1', [classCode]);
    if (classResult.rows.length === 0) {
      await client.end();
      return res.status(400).json({ error: 'Invalid class code' });
    }
    const class_id = classResult.rows[0].id;
    // Check for matching student
    const studentResult = await client.query(
      'SELECT id, class_id FROM students WHERE username = $1 AND password = $2 AND class_id = $3',
      [username, password, class_id]
    );
    await client.end();
    if (studentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username, password, or class code' });
    }
    return res.status(200).json({ id: studentResult.rows[0].id, class_id });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
} 