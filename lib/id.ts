import { randomBytes } from "crypto";

/** Generate a URL-safe random ID (default 21 chars, like nanoid). */
export function newId(size = 21): string {
  const bytes = randomBytes(size);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let id = "";
  for (let i = 0; i < size; i++) {
    id += chars[bytes[i] % 64];
  }
  return id;
}
