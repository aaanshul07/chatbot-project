const express = require('express');
const bodyParser = require('body-parser');
const Fuse = require('fuse.js');
const session = require('express-session');
const dotenv = require('dotenv');

// Load appropriate .env file
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

const app = express();

// ===== DB SETUP =====
let dbType, db;

if (env === 'production') {
  const { createClient } = require('@libsql/client');
  dbType = 'libsql';
  db = createClient({
    url: process.env.DB_URL,
    authToken: process.env.DB_AUTH_TOKEN || undefined,
  });
  console.log("✅ Using Turso (libSQL) for production");
} else {
  const mysql = require('mysql2/promise');
  dbType = 'mysql';
  db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  });
  console.log("✅ Using MySQL for local development");
}

// ===== Unified Query Runner =====
async function runQuery(sql, args = []) {
  if (dbType === 'libsql') {
    return await db.execute({ sql, args });
  } else {
    const [rows] = await db.execute(sql, args);
    return { rows };
  }
}

// ===== Middleware =====
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== Routes =====

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    await runQuery('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing credentials');

  try {
    const result = await runQuery('SELECT * FROM users WHERE username = ?', [username]);
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

// Check login
app.get('/checkLogin', (req, res) => {
  if (req.session.userId) res.status(200).send('User is logged in');
  else res.status(401).send('User is not logged in');
});

// Add Q&A
app.post('/add-qa', async (req, res) => {
  const { question, answer } = req.body;
  const userId = req.session.userId;

  try {
    if (userId) {
      await runQuery('DELETE FROM user_data WHERE user_id = ? AND question = ?', [userId, question]);
      await runQuery('INSERT INTO user_data (user_id, question, answer) VALUES (?, ?, ?)', [userId, question, answer]);
      res.json({ message: "Saved to your personal data." });
    } else {
      await runQuery('DELETE FROM guest_data WHERE question = ?', [question]);
      await runQuery('INSERT INTO guest_data (question, answer) VALUES (?, ?)', [question, answer]);
      res.json({ message: "Saved to guest data (shared globally)." });
    }
  } catch (err) {
    console.error('Add QA Error:', err);
    res.status(500).json({ message: "Database error" });
  }
});

// Chat
app.post('/chat', async (req, res) => {
  const message = req.body.message?.trim().toLowerCase();
  const userId = req.session.userId;
  if (!message) return res.status(400).send('No message provided');

  try {
    const defaultData = await runQuery('SELECT question, answer FROM default_data');
    const guestData = await runQuery('SELECT question, answer FROM guest_data');
    let dataToSearch = [...defaultData.rows, ...guestData.rows];

    if (userId) {
      const userData = await runQuery('SELECT question, answer FROM user_data WHERE user_id = ?', [userId]);
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

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
