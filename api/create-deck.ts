import { Client } from 'pg';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, teacher_id } = req.body;

  if (!name || !teacher_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const result = await client.query(
      'INSERT INTO decks (name, teacher_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, name, teacher_id, created_at',
      [name, teacher_id]
    );
    await client.end();
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err });
  }
} 