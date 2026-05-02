const express = require('express');
const bodyParser = require('body-parser');
const Fuse = require('fuse.js');
const session = require('express-session');
const dotenv = require('dotenv');

// Load environment
require('dotenv').config();

const app = express();

// ===== TURSO DB ONLY =====
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ===== Unified Query =====
async function runQuery(sql, args = []) {
  return await db.execute(sql, args);
}

// ===== Middleware =====
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// =======================
// REGISTER
// =======================
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    await runQuery(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    res.json({ message: 'Registration successful' });

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// =======================
// LOGIN
// =======================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).send('Missing credentials');

  try {
    const result = await runQuery(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    const user = result.rows[0];

    if (!user) return res.status(401).send('User not found');
    if (user.password !== password) return res.status(401).send('Invalid password');

    req.session.userId = user.id;
    req.session.username = user.username;

    res.status(200).send('Login successful');

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// =======================
// CHECK LOGIN
// =======================
app.get('/checkLogin', (req, res) => {
  if (req.session.userId) {
    res.status(200).send('User is logged in');
  } else {
    res.status(401).send('User is not logged in');
  }
});

// =======================
// ADD Q&A
// =======================
app.post('/add-qa', async (req, res) => {
  const { question, answer } = req.body;
  const userId = req.session.userId;

  try {
    if (userId) {
      await runQuery(
        'DELETE FROM user_data WHERE user_id = ? AND question = ?',
        [userId, question]
      );

      await runQuery(
        'INSERT INTO user_data (user_id, question, answer) VALUES (?, ?, ?)',
        [userId, question, answer]
      );

      res.json({ message: "Saved to your personal data." });

    } else {
      await runQuery(
        'DELETE FROM guest_data WHERE question = ?',
        [question]
      );

      await runQuery(
        'INSERT INTO guest_data (question, answer) VALUES (?, ?)',
        [question, answer]
      );

      res.json({ message: "Saved to guest data (shared)." });
    }

  } catch (err) {
    console.error('Add QA Error:', err);
    res.status(500).json({ message: "Database error" });
  }
});

// =======================
// CHAT
// =======================
app.post('/chat', async (req, res) => {
  const message = req.body.message?.trim().toLowerCase();
  const userId = req.session.userId;

  if (!message)
    return res.status(400).send('No message provided');

  try {
    const defaultData = await runQuery(
      'SELECT question, answer FROM default_data'
    );

    const guestData = await runQuery(
      'SELECT question, answer FROM guest_data'
    );

    let dataToSearch = [...defaultData.rows, ...guestData.rows];

    if (userId) {
      const userData = await runQuery(
        'SELECT question, answer FROM user_data WHERE user_id = ?',
        [userId]
      );

      dataToSearch = [...dataToSearch, ...userData.rows];
    }

    const fuse = new Fuse(dataToSearch, {
      keys: ['question'],
      includeScore: true,
      threshold: 0.3
    });

    const result = fuse.search(message);

    if (result.length > 0) {
      res.json({ reply: result[0].item.answer });
    } else {
      res.json({ reply: "Sorry, I don’t know that yet." });
    }

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});