import crypto from "crypto";

const ALGO = "aes-256-gcm";

const KEY = process.env.ENCRYPTION_KEY || "dev_key_32_bytes_minimum________";

function keyBuffer() {
  // allow hex or base64 or raw passphrase
  if (KEY.length === 64 && /^[0-9a-f]+$/i.test(KEY)) {
    return Buffer.from(KEY, "hex");
  }
  return crypto.createHash("sha256").update(KEY).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, keyBuffer(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const enc = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGO, keyBuffer(), iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(enc), decipher.final()]);
  return out.toString("utf8");
}
