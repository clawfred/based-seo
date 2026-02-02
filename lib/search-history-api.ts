/** Fire-and-forget search history recording. */

export async function recordSearch(
  userId: string | null,
  query: string,
  tool: "overview" | "finder",
  locationCode?: number,
): Promise<void> {
  if (!userId) return;

  try {
    const token = await (window as any).__privyGetAccessToken?.();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    await fetch("/api/search-history", {
      method: "POST",
      headers,
      body: JSON.stringify({ query, tool, locationCode }),
    });
  } catch {}
}
