import { google, gmail_v1 } from "googleapis";
import { decrypt } from "./utils/crypto";
import { OAuth2Client } from "google-auth-library";

export function buildGmailClientFromTokens(refreshTokenEnc?: string, accessTokenEnc?: string, expiry?: Date | null) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  if (!refreshTokenEnc && !accessTokenEnc) throw new Error("No tokens");

  try {
    if (refreshTokenEnc) {
      const refresh = decrypt(refreshTokenEnc);
      client.setCredentials({ refresh_token: refresh });
    }
    if (accessTokenEnc) {
      const access = decrypt(accessTokenEnc);
      client.setCredentials({ access_token: access, expiry_date: expiry ? expiry.getTime() : undefined });
    }
  } catch (err) {
    throw err;
  }

  const gmail = google.gmail({ version: "v1", auth: client });
  return { client, gmail };
}

export async function sendReply(gmail: gmail_v1.Gmail, threadId: string, to: string, subject: string, bodyText: string, inReplyTo?: string) {
  // create raw RFC822 message
  const messageLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `In-Reply-To: ${inReplyTo || ""}`,
    `References: ${inReplyTo || ""}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    bodyText
  ];
  const message = messageLines.join("\r\n");

  const encoded = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      threadId,
      raw: encoded
    }
  });
}
