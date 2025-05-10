const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234', // change if your MySQL password is different
  database: 'chatbot_db'
});

db.connect((err) => {
  if (err) {
    console.error('DB Connection Error:', err);
  } else {
    console.log('Connected to MySQL Database');
  }
});

module.exports = db;

