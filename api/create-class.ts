import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, teacher_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Class name is required' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const result = await client.query(
      'INSERT INTO classes (name, teacher_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id',
      [name, teacher_id || null]
    );
    await client.end();
    return res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err });
  }
} 