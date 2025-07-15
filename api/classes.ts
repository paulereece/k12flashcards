import { Client } from 'pg';

export default async function handler(req, res) {
  const { method, query, body } = req;
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    // GET /api/classes (all or by teacher)
    if (method === 'GET' && !query.id && !query.classId && !query.students) {
      const { teacher_id } = query;
      let result;
      if (teacher_id) {
        result = await client.query(
          'SELECT id, name, code, created_at, updated_at FROM classes WHERE teacher_id = $1 ORDER BY created_at DESC',
          [teacher_id]
        );
      } else {
        result = await client.query(
          'SELECT id, name, code, created_at, updated_at FROM classes ORDER BY created_at DESC'
        );
      }
      return res.status(200).json(result.rows);
    }
    // GET /api/classes/:id
    if (method === 'GET' && query.id) {
      const result = await client.query(
        'SELECT id, name, code, created_at, updated_at FROM classes WHERE id = $1',
        [query.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found' });
      }
      return res.status(200).json(result.rows[0]);
    }
    // PUT /api/classes/:id
    if (method === 'PUT' && query.id) {
      const { name } = body;
      if (!name) return res.status(400).json({ error: 'Class name is required' });
      const result = await client.query(
        'UPDATE classes SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, code, created_at, updated_at',
        [name, query.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Class not found' });
      }
      return res.status(200).json(result.rows[0]);
    }
    // GET /api/classes/:id/students
    if (method === 'GET' && query.classId && query.students) {
      const result = await client.query(
        'SELECT id, username FROM students WHERE class_id = $1 ORDER BY username',
        [query.classId]
      );
      return res.status(200).json(result.rows);
    }
    // If no route matched
    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    await client.end();
  }
} 