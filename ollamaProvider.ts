import type { AIProvider } from "./types";

type OllamaResponse = {
  response?: string;
};

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    this.model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  }

  async generateReply(input: {
    system: string;
    thread: string;
  }): Promise<string> {
    const prompt = [
      input.system,
      "",
      "Conversation:",
      input.thread,
      "",
      "Write only the email reply. Do not include a subject line.",
    ].join("\n");

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.4,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = (await response.json()) as OllamaResponse;
    const reply = data.response?.trim();

    if (!reply) {
      throw new Error("Ollama returned an empty reply");
    }

    return reply;
  }
}
