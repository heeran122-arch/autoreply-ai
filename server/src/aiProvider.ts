import OpenAI from "openai";

/**
 * AI provider abstraction. This file includes an OpenAI implementation.
 * To add a new provider, implement generateReply(prompt, opts) and export accordingly.
 */

const provider = process.env.AI_PROVIDER || "openai";

export interface GenerateOptions {
  instructions?: string[]; // user-specified instructions (tone, length, no emojis)
  conversation?: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

export async function generateReply(subject: string, conversationText: string, opts: GenerateOptions) {
  if (provider === "openai") {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemPrompt = `You are Autoreply AI. Follow user instructions precisely. Keep replies conversational, natural, and avoid robotic phrasing.`;
    const userInstructions = (opts.instructions || []).join(" ");

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `User instructions: ${userInstructions}` },
      { role: "user", content: `Subject: ${subject}\n\nConversation:\n${conversationText}\n\nPlease write a concise, appropriate reply that answers the latest message.` }
    ];

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: opts.maxTokens || 300,
      temperature: opts.temperature ?? 0.3
    } as any);

    const text = resp.choices?.[0]?.message?.content ?? "";
    return text.trim();
  }

  throw new Error("No AI provider configured");
}
