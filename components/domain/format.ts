/** Display formatters shared across the domain stat cards and tables. */

/** Whole-number count with grouping, e.g. `12,043`. */
export function formatInt(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString();
}

/** Compact magnitude for large figures, e.g. `1.2M`, `48.5K`. */
export function formatCompact(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** USD, compact past five figures so a card never overflows. */
export function formatMoney(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const compact = n >= 10_000;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(n);
}

/** Strip protocol/trailing slash so a URL reads as a bare host/path. */
export function prettyUrl(url: string | undefined | null): string {
  if (!url) return "—";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
