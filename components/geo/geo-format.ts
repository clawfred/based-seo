/** Display formatters shared across the GEO (AI visibility) views. */

export function formatCount(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

/** A 0–1 ratio or a 0–100 value, rendered as a percentage. */
export function formatPercent(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const pct = n <= 1 ? n * 100 : n;
  return `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
}

/** DataForSEO timestamps look like `2024-05-14 06:12:41 +00:00`; show the date. */
export function formatDate(raw: string | undefined | null): string {
  if (!raw) return "—";
  const date = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Strip protocol/trailing slash so a URL reads as a bare host/path. */
export function prettyUrl(url: string | undefined | null): string {
  if (!url) return "—";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Title-case a snake_case field name for a generic key/value fallback. */
export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
