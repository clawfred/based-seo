/** Small display helpers for the Site Audit tables and cards. */

export function formatCount(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

/** Strip protocol and trailing slash so a URL reads as a bare host/path. */
export function prettyUrl(url: string | undefined | null): string {
  if (!url) return "—";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Best-effort hostname from a raw target the user typed. */
export function hostOf(raw: string): string {
  const trimmed = raw.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return trimmed || raw.trim();
}

/** OnPage timings are milliseconds; show whole ms or seconds when large. */
export function formatMs(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || Number.isNaN(ms)) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

/** Round an onpage_score (0–100) for display; guards non-numbers. */
export function scoreValue(score: number | undefined | null): number | null {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  return Math.round(score);
}

/** Turn a raw USD amount into a compact price label. */
export function formatUsd(usd: number): string {
  if (usd <= 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}
