import { Client } from 'pg';

export default async function handler(req, res) {
  const { method, query, body } = req;
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    // GET /api/decks (all for teacher)
    if (method === 'GET' && !query.deckId && !query.cards) {
      const { teacher_id } = query;
      if (!teacher_id) {
        return res.status(400).json({ error: 'Missing teacher_id' });
      }
      const result = await client.query(
        'SELECT id, name, created_at FROM decks WHERE teacher_id = $1 ORDER BY created_at DESC',
        [teacher_id]
      );
      return res.status(200).json(result.rows);
    }
    // GET /api/decks/:deckId
    if (method === 'GET' && query.deckId && !query.cards) {
      const { deckId } = query;
      const result = await client.query(
        'SELECT id, name, created_at, teacher_id FROM decks WHERE id = $1',
        [deckId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Deck not found' });
      }
      return res.status(200).json(result.rows[0]);
    }
    // PUT /api/decks/:deckId
    if (method === 'PUT' && query.deckId) {
      const { name } = body;
      if (!name) return res.status(400).json({ error: 'Missing deck name' });
      await client.query(
        'UPDATE decks SET name = $1, updated_at = NOW() WHERE id = $2',
        [name, query.deckId]
      );
      return res.status(200).json({ success: true });
    }
    // DELETE /api/decks/:deckId
    if (method === 'DELETE' && query.deckId) {
      const { deckId } = query;
      // Delete cards first (if ON DELETE CASCADE is not set)
      await client.query('DELETE FROM cards WHERE deck_id = $1', [deckId]);
      await client.query('DELETE FROM decks WHERE id = $1', [deckId]);
      return res.status(200).json({ success: true });
    }
    // GET /api/decks/:deckId/cards
    if (method === 'GET' && query.deckId && query.cards) {
      const { deckId } = query;
      const result = await client.query(
        'SELECT id, question, answer, created_at FROM cards WHERE deck_id = $1 ORDER BY created_at ASC',
        [deckId]
      );
      return res.status(200).json(result.rows);
    }
    // POST /api/decks/:deckId/cards
    if (method === 'POST' && query.deckId && query.cards) {
      const { question, answer } = body;
      if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
      await client.query(
        'INSERT INTO cards (question, answer, deck_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [question, answer, query.deckId]
      );
      return res.status(200).json({ success: true });
    }
    // PUT /api/decks/:deckId/cards
    if (method === 'PUT' && query.deckId && query.cards) {
      const { oldQuestion, oldAnswer, newQuestion, newAnswer } = body;
      if (!oldQuestion || !oldAnswer || !newQuestion || !newAnswer) return res.status(400).json({ error: 'Missing fields' });
      await client.query(
        'UPDATE cards SET question = $1, answer = $2, updated_at = NOW() WHERE deck_id = $3 AND question = $4 AND answer = $5',
        [newQuestion, newAnswer, query.deckId, oldQuestion, oldAnswer]
      );
      return res.status(200).json({ success: true });
    }
    // DELETE /api/decks/:deckId/cards
    if (method === 'DELETE' && query.deckId && query.cards) {
      const { question, answer } = body;
      if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
      await client.query(
        'DELETE FROM cards WHERE deck_id = $1 AND question = $2 AND answer = $3',
        [query.deckId, question, answer]
      );
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