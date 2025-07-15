import { Client } from 'pg';

export default async function handler(req, res) {
  const { method, query, body } = req;
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    // POST /api/assignments
    if (method === 'POST') {
      const { deck_id, class_id, due_date } = body;
      if (!deck_id || !class_id || !due_date) {
        return res.status(400).json({ error: 'deck_id, class_id, and due_date are required' });
      }
      const result = await client.query(
        'INSERT INTO assignments (deck_id, class_id, due_date, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
        [deck_id, class_id, due_date]
      );
      return res.status(200).json({ id: result.rows[0].id });
    }
    // GET /api/assignments (all for teacher)
    if (method === 'GET' && query.teacher_id) {
      const { teacher_id } = query;
      const result = await client.query(
        `SELECT a.id, a.deck_id, a.class_id, a.due_date
         FROM assignments a
         JOIN decks d ON a.deck_id = d.id
         WHERE d.teacher_id = $1
         ORDER BY a.due_date DESC, a.created_at DESC`,
        [teacher_id]
      );
      return res.status(200).json(result.rows);
    }
    // GET /api/assignments/class/:classId
    if (method === 'GET' && query.classId) {
      const { classId } = query;
      const result = await client.query(
        `SELECT a.id, a.deck_id, d.name AS deck_name, a.class_id, a.due_date, a.created_at
         FROM assignments a
         JOIN decks d ON a.deck_id = d.id
         WHERE a.class_id = $1
         ORDER BY a.due_date DESC, a.created_at DESC`,
        [classId]
      );
      return res.status(200).json(result.rows);
    }
    // GET /api/assignments/:id
    if (method === 'GET' && query.id) {
      const { id } = query;
      const result = await client.query('SELECT * FROM assignments WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
      return res.status(200).json(result.rows[0]);
    }
    // DELETE /api/assignments/:id
    if (method === 'DELETE' && query.id) {
      const { id } = query;
      await client.query('DELETE FROM assignments WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }
    // If no route matched
    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    await client.end();
  }
} 