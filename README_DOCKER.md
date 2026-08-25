## Docker Compose instructions

To run the full stack with Docker Compose (Postgres, backend, static client served by nginx):

1. Ensure Docker and Docker Compose are installed.
2. Copy the example env file into the repo root and update it with your credentials:
   cp .env.example .env
   Edit .env and set DATABASE_URL to "postgresql://autoreply:autoreply_password@db:5432/autoreply?schema=public" (or your external DB), and set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, OPENAI_API_KEY, SESSION_SECRET, ENCRYPTION_KEY.

3. Start the stack:
   docker compose up --build

4. Open the client in your browser:
   http://localhost:5173

Notes:
- The nginx reverse proxy in the client container proxies /api and /auth to the backend container so the frontend can use relative paths like `/api/me` and `/auth/google`.
- The backend uses DATABASE_URL from .env. The default postgres container is exposed on port 5432 and uses credentials from docker-compose. You can change these.
- You still need to set the GOOGLE_REDIRECT_URI to match the externally reachable URL. For local testing, use ngrok and set GOOGLE_REDIRECT_URI to https://<ngrok-id>.ngrok.io/auth/google/callback and then set FRONTEND_URL and GOOGLE_REDIRECT_URI in .env accordingly.
- For production deployment you should use managed Postgres and secure the ENCRYPTION_KEY via a secrets manager.
