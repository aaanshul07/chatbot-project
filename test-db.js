const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testConnection() {
  try {
    const result = await db.execute("SELECT 1");
    console.log("✅ Turso Connected Successfully");
    console.log(result);
  } catch (err) {
    console.error("❌ Connection Failed:", err);
  }
}

testConnection();
