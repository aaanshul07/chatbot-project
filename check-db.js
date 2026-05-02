const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function check() {
  try {
    const result = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );

    console.log("📦 Tables in database:");
    console.log(result.rows);

  } catch (err) {
    console.error("❌ Error:", err);
  }
}

check();