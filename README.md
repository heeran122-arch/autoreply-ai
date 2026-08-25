# AutoReply AI

AutoReply AI is an AI email agent that connects to a user's Gmail account and automatically replies to incoming emails (with safety checks). This project is a complete starter app including backend, frontend, database schema, and worker.

Features
- Google OAuth (Gmail API) for secure authentication
- Dashboard with connected email, agent ON/OFF, stats, recent conversations
- Worker that polls Gmail, reads thread history, generates replies via AI, and sends replies
- Configurable reply tone/instructions
- Never Reply list (addresses or domains)
- History and "Needs Review" marking for sensitive/uncertain emails
- Pluggable AI provider (OpenAI adapter included)

Important security note
- Never commit your real OAuth credentials, tokens, or API keys. Use environment variables (see .env.example).

Contents
- /server - Express backend (TypeScript)
- /client - React frontend (Vite + Tailwind)
- /prisma - Prisma schema and migrations

Quick start (local)
1. Install prerequisites:
   - Node 18+
   - PostgreSQL
   - ngrok (recommended for OAuth during local development)

2. Create Google OAuth credentials:
   - Go to Google Cloud Console -> APIs & Services -> Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: e.g. https://<your-ngrok-domain>/auth/google/callback (or http://localhost:3000/auth/google/callback if reachable)
   - Enable Gmail API for your project

3. Create an OpenAI API key (or other AI provider)

4. Copy `.env.example` to `.env` and fill values.

5. Setup database:
   - Create PostgreSQL DB and update DATABASE_URL env var.
   - From /server: `npm install` then `npx prisma migrate dev --name init`

6. Start the backend and worker:
   - From /server: `npm run dev` (starts Express server)
   - Start worker (same process included; worker spawns job loop automatically)

7. Start the frontend:
   - From /client: `npm install` then `npm run dev`

8. Visit frontend, click "Connect Gmail", follow OAuth flow.

Production notes
- Use HTTPS and a real domain for OAuth redirect URIs.
- Consider using Google Pub/Sub + Gmail push notifications instead of polling for scale.
- Rotate and secure encryption keys; consider using a secrets manager.

This README contains more detailed run & troubleshooting steps below.
