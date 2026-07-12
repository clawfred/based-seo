/** Display formatters shared across the backlink tables and stat cards. */

export function formatCount(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString();
}

/** DataForSEO timestamps look like `2021-05-14 06:12:41 +00:00`; show the date. */
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
