// migrate.js

const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config(); // ✅ load .env

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,      
  authToken: process.env.TURSO_AUTH_TOKEN,  
});

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, 'db.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    const statements = sqlContent
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const stmt of statements) {
      await db.execute(stmt);
    }

    console.log('✅ Database migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();