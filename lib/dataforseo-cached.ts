import { dataforseoFetch } from "./dataforseo-server";
import { getCachedResponse, setCachedResponse } from "./api-cache";

/**
 * Wrapper around dataforseoFetch that checks/stores in the DB cache.
 * Cache TTL defaults to 24 hours (keyword data doesn't change hourly).
 */
export async function cachedDataforseoFetch(
  url: string,
  body: unknown[],
  ttlHours: number = 24,
): Promise<Record<string, unknown>> {
  const cacheParams = { url, body };

  // Try cache first
  const cached = await getCachedResponse<Record<string, unknown>>(url, cacheParams);
  if (cached) {
    return cached;
  }

  // Cache miss — call DataForSEO
  const result = await dataforseoFetch(url, body);

  // Store in cache (best-effort, non-blocking)
  setCachedResponse(url, cacheParams, result, ttlHours).catch(() => {});

  return result;
}
