import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from dbmate.env
const envPath = path.join(__dirname, 'dbmate.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Match both quoted and unquoted DATABASE_URL
  const match = envContent.match(/DATABASE_URL=\"?([^\"\n]+)\"?/);
  if (match) {
    process.env.DATABASE_URL = match[1];
    console.log('[server.js] Loaded DATABASE_URL from dbmate.env');
  } else {
    console.warn('[server.js] Could not find DATABASE_URL in dbmate.env');
  }
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
// Helper function to ensure a user exists in the users table
async function ensureUserExists(client, userId, email) {
  console.log(`[ensureUserExists] called with userId: ${userId}, email: ${email}`);
  const existing = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (existing.rows.length === 0) {
    try {
      await client.query(
        'INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)',
        [userId, email, '', 'teacher']
      );
      console.log(`[ensureUserExists] Inserted user: ${userId}, email: ${email}`);
    } catch (err) {
      console.error(`[ensureUserExists] Failed to insert user: ${userId}, email: ${email}`, err);
    }
  } else {
    console.log(`[ensureUserExists] User already exists: ${userId}`);
  }
}

app.post('/api/create-class', async (req, res) => {
  const { name, teacher_id, teacher_email } = req.body;

  if (!name || !teacher_id || !teacher_email) {
    return res.status(400).json({ error: 'Class name, teacher_id, and teacher_email are required' });
  }

  console.log('[create-class] teacher_id:', teacher_id, 'teacher_email:', teacher_email);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await ensureUserExists(client, teacher_id, teacher_email);
    // Generate a random 6-character class code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await client.query(
      'INSERT INTO classes (name, code, teacher_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, code',
      [name, code, teacher_id]
    );
    await client.end();
    return res.status(200).json({ id: result.rows[0].id, code: result.rows[0].code });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/create-deck', async (req, res) => {
  console.log('[create-deck] endpoint called');
  const { name, teacher_id, teacher_email } = req.body;
  if (!name || !teacher_id || !teacher_email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log('[create-deck] teacher_id:', teacher_id, 'teacher_email:', teacher_email);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    console.log('[create-deck] Connected to DB, about to call ensureUserExists');
    await ensureUserExists(client, teacher_id, teacher_email);
    console.log('[create-deck] Finished ensureUserExists');
    const result = await client.query(
      'INSERT INTO decks (name, teacher_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) RETURNING id, name, teacher_id, created_at',
      [name, teacher_id]
    );
    await client.end();
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('[create-deck] ERROR:', err);
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Add more API routes here as needed...

app.post('/api/add-student', async (req, res) => {
  console.log('POST /api/add-student called');
  const { username, password, class_id } = req.body;
  if (!username || !password || !class_id) {
    console.log('Missing required fields:', { username, password, class_id });
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const result = await client.query(
      'INSERT INTO students (username, password, class_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
      [username, password, class_id]
    );
    await client.end();
    console.log('Student added:', result.rows[0]);
    return res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('Error in /api/add-student:', err);
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  const { deck_id, class_id, due_date } = req.body;
  if (!deck_id || !class_id || !due_date) {
    return res.status(400).json({ error: 'deck_id, class_id, and due_date are required' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      'INSERT INTO assignments (deck_id, class_id, due_date, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
      [deck_id, class_id, due_date]
    );
    await client.end();
    return res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/assignments', async (req, res) => {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return res.status(400).json({ error: 'Missing teacher_id' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // Get all assignments for decks owned by this teacher
    const result = await client.query(
      `SELECT a.id, a.deck_id, a.class_id, a.due_date
       FROM assignments a
       JOIN decks d ON a.deck_id = d.id
       WHERE d.teacher_id = $1
       ORDER BY a.due_date DESC, a.created_at DESC`,
      [teacher_id]
    );
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/assignments/class/:classId', async (req, res) => {
  const { classId } = req.params;
  if (!classId) {
    return res.status(400).json({ error: 'Missing classId' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      `SELECT a.id, a.deck_id, d.name AS deck_name, a.class_id, a.due_date, a.created_at
       FROM assignments a
       JOIN decks d ON a.deck_id = d.id
       WHERE a.class_id = $1
       ORDER BY a.due_date DESC, a.created_at DESC`,
      [classId]
    );
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing assignment id' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query('DELETE FROM assignments WHERE id = $1', [id]);
    await client.end();
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Missing assignment id' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query('SELECT * FROM assignments WHERE id = $1', [id]);
    await client.end();
    if (result.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/classes', async (req, res) => {
  const { teacher_id } = req.query;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
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
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get class details by id
app.get('/api/classes/:id', async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, name, code, created_at, updated_at FROM classes WHERE id = $1',
      [req.params.id]
    );
    await client.end();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update class name by id
app.put('/api/classes/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Class name is required' });
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const result = await client.query(
      'UPDATE classes SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, code, created_at, updated_at',
      [name, req.params.id]
    );
    await client.end();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/classes/:id/students', async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, username FROM students WHERE class_id = $1 ORDER BY username',
      [req.params.id]
    );
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.get('/api/decks', async (req, res) => {
  const { teacher_id } = req.query;
  if (!teacher_id) {
    return res.status(400).json({ error: 'Missing teacher_id' });
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, name, created_at FROM decks WHERE teacher_id = $1 ORDER BY created_at DESC',
      [teacher_id]
    );
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// GET all cards for a specific deck
app.get('/api/decks/:deckId/cards', async (req, res) => {
  const { deckId } = req.params;
  if (!deckId) {
    return res.status(400).json({ error: 'Missing deckId' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, question, answer, created_at FROM cards WHERE deck_id = $1 ORDER BY created_at ASC',
      [deckId]
    );
    await client.end();
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cards for deck:', err);
    await client.end();
    res.status(500).json({ error: 'Failed to fetch cards for this deck.' });
  }
});

// Add a card to a deck
app.post('/api/decks/:deckId/cards', async (req, res) => {
  const { deckId } = req.params;
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(
      'INSERT INTO cards (question, answer, deck_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
      [question, answer, deckId]
    );
    await client.end();
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Edit a card in a deck (find by old question/answer)
app.put('/api/decks/:deckId/cards', async (req, res) => {
  const { deckId } = req.params;
  const { oldQuestion, oldAnswer, newQuestion, newAnswer } = req.body;
  if (!oldQuestion || !oldAnswer || !newQuestion || !newAnswer) return res.status(400).json({ error: 'Missing fields' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(
      'UPDATE cards SET question = $1, answer = $2, updated_at = NOW() WHERE deck_id = $3 AND question = $4 AND answer = $5',
      [newQuestion, newAnswer, deckId, oldQuestion, oldAnswer]
    );
    await client.end();
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete a card from a deck (by question/answer)
app.delete('/api/decks/:deckId/cards', async (req, res) => {
  const { deckId } = req.params;
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(
      'DELETE FROM cards WHERE deck_id = $1 AND question = $2 AND answer = $3',
      [deckId, question, answer]
    );
    await client.end();
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update deck name
app.put('/api/decks/:deckId', async (req, res) => {
  const { deckId } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing deck name' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(
      'UPDATE decks SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, deckId]
    );
    await client.end();
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete a deck and all its cards
app.delete('/api/decks/:deckId', async (req, res) => {
  const { deckId } = req.params;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // Delete cards first (if ON DELETE CASCADE is not set)
    await client.query('DELETE FROM cards WHERE deck_id = $1', [deckId]);
    // Delete the deck
    const result = await client.query('DELETE FROM decks WHERE id = $1', [deckId]);
    await client.end();
    return res.status(200).json({ success: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get a single deck by ID
app.get('/api/decks/:deckId', async (req, res) => {
  const { deckId } = req.params;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, name, created_at, teacher_id FROM decks WHERE id = $1',
      [deckId]
    );
    await client.end();
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

app.post('/api/student-login', async (req, res) => {
  const { username, password, classCode } = req.body;
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
});

// Helper function to get or create a test teacher
async function getOrCreateTestTeacher(client) {
  // First try to find an existing teacher
  const existingTeacher = await client.query(
    'SELECT id FROM users WHERE role = $1 LIMIT 1',
    ['teacher']
  );
  
  if (existingTeacher.rows.length > 0) {
    return existingTeacher.rows[0].id;
  }
  
  // Create a test teacher if none exists
  const newTeacher = await client.query(
    'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
    ['test@example.com', 'password123', 'teacher']
  );
  
  return newTeacher.rows[0].id;
}

app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
}); 

app.get('/api/study-sessions/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  if (!studentId) {
    return res.status(400).json({ error: 'Missing studentId' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, assignment_id, score_percent, completed_at
       FROM study_sessions
       WHERE student_id = $1
       ORDER BY completed_at DESC`,
      [studentId]
    );
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
}); 

app.post('/api/study-sessions', async (req, res) => {
  const { assignment_id, student_id, score_percent, time_seconds } = req.body;
  if (!assignment_id || !student_id || typeof score_percent !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO study_sessions (assignment_id, student_id, score_percent, completed_at, created_at, time_seconds)
       VALUES ($1, $2, $3, NOW(), NOW(), $4) RETURNING id, assignment_id, student_id, score_percent, completed_at, time_seconds`,
      [assignment_id, student_id, score_percent, time_seconds || null]
    );
    await client.end();
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
}); 

app.get('/api/study-sessions', async (req, res) => {
  const { assignment_id } = req.query;
  if (!assignment_id) return res.status(400).json({ error: 'Missing assignment_id' });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(
      'SELECT * FROM study_sessions WHERE assignment_id = $1 ORDER BY completed_at DESC',
      [assignment_id]
    );
    await client.end();
    return res.status(200).json(result.rows);
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
}); 