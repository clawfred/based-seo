/** Fire-and-forget search history recording. */

export function recordSearch(
  userId: string | null,
  query: string,
  tool: "overview" | "finder",
  locationCode?: number,
): void {
  if (!userId) return; // Only record for authenticated users

  fetch("/api/search-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, query, tool, locationCode }),
  }).catch(() => {}); // Best-effort
}
