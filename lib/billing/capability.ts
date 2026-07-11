/**
 * Capability tokens for async task retrieval.
 *
 * A wallet-only agent that pays for a `task_post` has no Privy session, so it
 * cannot prove ownership of the resulting task by identity. Instead we hand it a
 * signed token at post time; possession of the token IS the authorization to
 * fetch that one task's result. Browser users can use either the token or their
 * session.
 *
 * The token is an HMAC over `{taskId, exp}`, so it is unforgeable without the
 * server secret and only ever grants access to the single task it names. We
 * store only its hash on the task row, so a database leak does not yield working
 * tokens.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60_000; // DataForSEO stores results 30 days.

// Read lazily, not at module load: env may be injected after import, and a
// module-load-time capture is a classic serverless footgun.
function secret(): string {
  const s = process.env.CAPABILITY_TOKEN_SECRET ?? process.env.PRIVY_APP_SECRET ?? "";
  if (!s) throw new Error("CAPABILITY_TOKEN_SECRET (or PRIVY_APP_SECRET) must be set");
  return s;
}

export interface CapabilityToken {
  token: string;
  /** Store this on the task row; never store the token itself. */
  hash: string;
  expiresAt: Date;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function hashToken(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("base64url");
}

/**
 * The secret embedded in a task's postback URL, derived from its id so the
 * webhook can verify a caller without storing a per-task secret. An attacker who
 * knows a task id still cannot forge the postback without the server secret.
 */
export function webhookSecretFor(taskId: string): string {
  return createHmac("sha256", secret()).update(`webhook:${taskId}`).digest("base64url");
}

export function verifyWebhookSecret(taskId: string, secret: string): boolean {
  const expected = webhookSecretFor(taskId);
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Mint a token for a task. The payload is public; the signature is not. */
export function mintCapabilityToken(taskId: string, ttlMs = DEFAULT_TTL_MS): CapabilityToken {
  const exp = Date.now() + ttlMs;
  const payload = `${taskId}.${exp}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
  return { token, hash: hashToken(token), expiresAt: new Date(exp) };
}

/**
 * Verify a token names `taskId` and has not expired. Constant-time on the
 * signature so a caller cannot probe it byte by byte.
 */
export function verifyCapabilityToken(token: string, taskId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  let payload: string;
  try {
    payload = Buffer.from(parts[0], "base64url").toString();
  } catch {
    return false;
  }

  const [tokenTaskId, expStr] = payload.split(".");
  if (tokenTaskId !== taskId) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const expected = sign(payload);
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
