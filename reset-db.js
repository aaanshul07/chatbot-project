const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function resetData() {
  try {
    await db.execute("DELETE FROM user_data");
    await db.execute("DELETE FROM guest_data");

    console.log("✅ Chatbot data reset successfully (Q&A cleared)");
  } catch (err) {
    console.error("❌ Error resetting data:", err);
  }
}

resetData();