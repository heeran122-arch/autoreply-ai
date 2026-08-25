import { PrismaClient } from "@prisma/client";
import { buildGmailClientFromTokens, sendReply } from "./gmailClient";
import { generateReply } from "./aiProvider";
import { decrypt } from "./utils/crypto";

/**
 * Poll-based worker. For each user with agentEnabled, it:
 * - lists unread inbox messages not from me
 * - fetches thread for context
 * - checks NeverReply list and basic safety heuristics
 * - uses AI to generate reply (if safe) and sends via Gmail
 * - saves history and marks messages as read
 *
 * In production you should replace with Gmail push notifications and message-level deduping.
 */

export function startWorkerLoop(prisma: PrismaClient) {
  // run every minute
  setInterval(() => runCycle(prisma).catch((e) => console.error("worker cycle error", e)), 60_000);
  // also run immediately on start
  runCycle(prisma).catch((e) => console.error("worker cycle error", e));
}

async function runCycle(prisma: PrismaClient) {
  const users = await prisma.user.findMany({ where: { agentEnabled: true } });
  for (const user of users) {
    try {
      if (!user.googleRefreshToken) continue;
      const { gmail, client } = buildGmailClientFromTokens(user.googleRefreshToken, user.googleAccessToken, user.tokenExpiry || null);
      // list unread messages in inbox not from me
      const list = await gmail.users.messages.list({
        userId: "me",
        q: "in:inbox is:unread -from:me",
        maxResults: 10
      });

      const messages = list.data.messages || [];
      for (const m of messages) {
        try {
          const msg = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
          const payload = msg.data;
          const headers = payload.payload?.headers || [];
          const subject = headers.find(h => h.name?.toLowerCase() === "subject")?.value || "(no subject)";
          const from = headers.find(h => h.name?.toLowerCase() === "from")?.value || "";
          const messageId = headers.find(h => h.name?.toLowerCase() === "message-id")?.value || "";
          const threadId = payload.threadId || m.id!;
          // convert raw parts to text (simple)
          const bodyText = getTextFromPayload(payload.payload);

          // never reply checks
          const neverList = await prisma.neverReply.findMany({ where: { userId: user.id } });
          if (matchesNeverReply(from, neverList)) {
            await prisma.history.create({
              data: {
                userId: user.id,
                threadId,
                messageId: m.id!,
                sender: from,
                subject,
                originalBody: bodyText,
                aiResponse: "",
                wasAutoSent: false,
                needsReview: true
              }
            });
            await gmail.users.messages.modify({ userId: "me", id: m.id!, requestBody: { removeLabelIds: ["UNREAD"] } });
            continue;
          }

          // basic sensitivity check
          if (isSensitiveEmail(subject + " " + bodyText)) {
            await prisma.history.create({
              data: {
                userId: user.id,
                threadId,
                messageId: m.id!,
                sender: from,
                subject,
                originalBody: bodyText,
                aiResponse: "",
                wasAutoSent: false,
                needsReview: true
              }
            });
            await gmail.users.messages.modify({ userId: "me", id: m.id!, requestBody: { removeLabelIds: ["UNREAD"] } });
            continue;
          }

          // fetch thread context
          const thread = await gmail.users.threads.get({ userId: "me", id: threadId });
          const conversationText = threadToPlainText(thread.data);

          // generate reply
          const instructions = (user.settings?.instructions || []) as string[] || [];
          const reply = await generateReply(subject, conversationText, { instructions });

          // if reply is empty or unclear, mark needs review
          if (!reply || reply.length < 5) {
            await prisma.history.create({
              data: {
                userId: user.id,
                threadId,
                messageId: m.id!,
                sender: from,
                subject,
                originalBody: bodyText,
                aiResponse: "",
                wasAutoSent: false,
                needsReview: true
              }
            });
            await gmail.users.messages.modify({ userId: "me", id: m.id!, requestBody: { removeLabelIds: ["UNREAD"] } });
            continue;
          }

          // send reply
          await sendReply(gmail, threadId, extractEmailAddress(from), `Re: ${subject}`, reply, messageId);
          // store history
          await prisma.history.create({
            data: {
              userId: user.id,
              threadId,
              messageId: m.id!,
              sender: from,
              subject,
              originalBody: bodyText,
              aiResponse: reply,
              wasAutoSent: true,
              needsReview: false
            }
          });

          // mark message read
          await gmail.users.messages.modify({ userId: "me", id: m.id!, requestBody: { removeLabelIds: ["UNREAD"] } });

        } catch (err) {
          console.error("Error processing message", err);
        }
      }
    } catch (err) {
      console.error("Error handling user worker", user.email, err);
    }
  }
}

// Helpers below

function getTextFromPayload(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const t = getTextFromPayload(part);
      if (t) return t;
    }
  }
  return "";
}

function threadToPlainText(thread: any): string {
  let out = "";
  const messages = thread.messages || [];
  for (const m of messages) {
    const headers = m.payload?.headers || [];
    const from = headers.find((h: any) => h.name?.toLowerCase() === "from")?.value || "";
    const subj = headers.find((h: any) => h.name?.toLowerCase() === "subject")?.value || "";
    const body = getTextFromPayload(m.payload);
    out += `From: ${from}\nSubject: ${subj}\n${body}\n\n---\n`;
  }
  return out;
}

function extractEmailAddress(fromHeader: string): string {
  const m = fromHeader.match(/<(.+?)>/);
  if (m) return m[1];
  return fromHeader.split(" ").pop() || fromHeader;
}

function matchesNeverReply(fromHeader: string, neverList: any[]): boolean {
  const email = extractEmailAddress(fromHeader).toLowerCase();
  for (const item of neverList) {
    const v = item.value.toLowerCase();
    if (v.includes("@") && email.endsWith(v)) return true;
    if (!v.includes("@") && email.endsWith("@" + v)) return true;
    if (email === v) return true;
  }
  return false;
}

function isSensitiveEmail(text: string): boolean {
  const s = text.toLowerCase();
  const keywords = [
    "password reset", "reset your password", "two-factor", "2fa", "authentication",
    "bank", "account number", "ssn", "social security", "credit card", "invoice",
    "transaction", "wire transfer", "legal", "lawsuit", "attorney", "confidential",
    "account locked", "suspended", "security alert", "suspicious sign-in"
  ];
  for (const k of keywords) {
    if (s.includes(k)) return true;
  }
  // basic phishing heuristics
  if (s.includes("verify your account") && s.includes("password")) return true;
  return false;
}
