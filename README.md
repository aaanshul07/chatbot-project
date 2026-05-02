# AI Chatbot Project (smog AI)

## Features

- User Login & Registration
- Guest Mode
- Chatbot with predefined responses
- User custom data panel

---

## How to Run This Project

1. Clone this repository

2. Open terminal in project folder

3. Install dependencies:
   npm install

4. Create a `.env` file and add:

   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
   SESSION_SECRET=your_secret_key

5. Run database migration:
   node migrate.js

6. Start server:
   node server.js

7. Open browser:
   http://localhost:3000

---

## Tech Used

- Node.js
- Express.js
- Turso (libSQL)
- HTML, CSS, JavaScript
