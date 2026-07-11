/**
 * Defensive readers over the DataForSEO AI Optimization envelope.
 *
 * The useful payload is always at `data.tasks[0].result[0]` (list endpoints
 * carry rows in `.items`). The exact field names for AI-visibility metrics
 * differ across endpoints and are not strongly documented, so every accessor
 * here probes a list of candidate keys and tolerates a partial shape rather
 * than assuming a fixed one.
 */

export type Row = Record<string, unknown>;

/** The single result object at `tasks[0].result[0]`, or null. */
export function resultOf(data: unknown): Row | null {
  const result = (data as { tasks?: Array<{ result?: unknown[] | null }> })?.tasks?.[0]?.result;
  const first = Array.isArray(result) ? result[0] : null;
  return isRow(first) ? first : null;
}

/** The `items` array on the first result, or []. */
export function itemsOf(data: unknown): Row[] {
  const items = (resultOf(data) as { items?: unknown[] } | null)?.items;
  return Array.isArray(items) ? items.filter(isRow) : [];
}

/** First candidate key that resolves to a finite number. */
export function num(row: Row | null | undefined, keys: string[]): number | undefined {
  if (!row) return undefined;
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

/** First candidate key that resolves to a non-empty string. */
export function str(row: Row | null | undefined, keys: string[]): string | undefined {
  if (!row) return undefined;
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return undefined;
}

function isRow(v: unknown): v is Row {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
