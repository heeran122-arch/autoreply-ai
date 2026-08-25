# AutoReply AI — Free Local AI

This adds a local AI option so AutoReply AI does not require OpenAI or another paid API.

## How it works

The app calls a model running locally through Ollama. No AI API key is required.

Default model:
- `llama3.2:3b`

Install Ollama, pull the model, then run the backend normally.

## Environment variables

Add:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2:3b
```

If the backend is not running inside Docker, use:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

## Important

This is a local open model, not a model trained from scratch by AutoReply AI. It is the practical free way to run your own AI inference without paying for an API.

The email safety checks should remain active. If the local model fails, the worker should mark the message `Needs Review` rather than automatically sending a guessed response.
