const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const Fuse = require('fuse.js');
const session = require('express-session');
const util = require('util');

const app = express();

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'chatbot_db'
});

// Promisify db.query for async/await
const query = util.promisify(db.query).bind(db);

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL');
});

// Session setup
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    await query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password]);
    res.json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Please provide both username and password');
  }

  try {
    const results = await query('SELECT * FROM users WHERE username = ?', [username]);

    if (results.length === 0) {
      return res.status(401).send('User not found');
    }

    const user = results[0];

    if (user.password !== password) {
      return res.status(401).send('Invalid password');
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    console.log('User logged in:', req.session);
    res.status(200).send('Login successful');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// Check login status route
app.get('/checkLogin', (req, res) => {
  if (req.session.userId) {
    res.status(200).send('User is logged in');
  } else {
    res.status(401).send('User is not logged in');
  }
});

//// Add Q&A for either guest or logged-in user
app.post('/add-qa', async (req, res) => {
  const { question, answer } = req.body;
  const userId = req.session.userId;

  try {
    if (userId) {
      // If user is logged in, save to their personal user_data
      await query('INSERT INTO user_data (user_id, question, answer) VALUES (?, ?, ?)', [userId, question, answer]);
      res.json({ message: "Saved to your personal data." });
    } else {
      // If guest, save to guest_data table (shared globally)
      await query('INSERT INTO guest_data (question, answer) VALUES (?, ?)', [question, answer]);
      res.json({ message: "Saved to guest data (shared globally)." });
    }
  } catch (err) {
    console.error('Add QA Error:', err);
    res.status(500).json({ message: "Database error" });
  }
});



// Chatbot response route
app.post('/chat', async (req, res) => {
  const message = req.body.message?.trim().toLowerCase();
  const userId = req.session.userId;

  if (!message) return res.status(400).send('No message provided');

  try {
    let userData = [];
    let guestData = await query('SELECT question, answer FROM guest_data');
    let defaultData = await query('SELECT question, answer FROM default_data');

    if (userId) {
      // If the user is logged in, fetch their personal data
      userData = await query('SELECT question, answer FROM user_data WHERE user_id = ?', [userId]);
    }

    // Combine guest data, user data (if logged in), and default data
    const allData = guestData.concat(userData, defaultData);

    // Fuse.js for fuzzy searching
    const fuse = new Fuse(allData, {
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


// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
