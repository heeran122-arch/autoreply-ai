# Tell the coding agent to integrate the local AI

Replace the current OpenAI-only requirement with a local Ollama provider.

1. Copy `server/src/ai/ollamaProvider.ts` into the project's AI provider directory.
2. Register `OllamaProvider` in the existing AI-provider factory/abstraction.
3. Support `AI_PROVIDER=ollama`.
4. Add these variables to `.env.example`:

AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2:3b

5. Remove `OPENAI_API_KEY` as a required variable when `AI_PROVIDER=ollama`.
6. Keep all existing Gmail safety checks and Never Reply rules.
7. If Ollama is unavailable, do NOT send an automatic email. Mark it Needs Review.
8. Update Docker configuration so the backend can reach Ollama on the host machine.
9. Update README with Ollama installation and model-pull instructions.
10. Run the TypeScript build and fix any errors.

Do not commit any API keys or secrets.
