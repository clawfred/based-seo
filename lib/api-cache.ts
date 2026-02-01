import { db } from "@/db";
import { apiCache } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import { createHash } from "crypto";

const DEFAULT_TTL_HOURS = 24;

function buildCacheKey(endpoint: string, params: Record<string, unknown>): string {
  const raw = JSON.stringify({ endpoint, ...params });
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Check cache for a DataForSEO response.
 * Returns the cached data if found and not expired, otherwise null.
 */
export async function getCachedResponse<T>(
  endpoint: string,
  params: Record<string, unknown>,
): Promise<T | null> {
  if (!db) return null;

  try {
    const key = buildCacheKey(endpoint, params);
    const rows = await db.select().from(apiCache).where(eq(apiCache.cacheKey, key)).limit(1);

    const row = rows[0];
    if (!row) return null;

    if (new Date() > row.expiresAt) {
      db.delete(apiCache)
        .where(eq(apiCache.cacheKey, key))
        .catch(() => {});
      return null;
    }

    return row.data as T;
  } catch {
    return null;
  }
}

/**
 * Store a DataForSEO response in the cache.
 */
export async function setCachedResponse(
  endpoint: string,
  params: Record<string, unknown>,
  data: unknown,
  ttlHours: number = DEFAULT_TTL_HOURS,
): Promise<void> {
  if (!db) return;

  try {
    const key = buildCacheKey(endpoint, params);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    await db
      .insert(apiCache)
      .values({
        cacheKey: key,
        data,
        fetchedAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: apiCache.cacheKey,
        set: { data, fetchedAt: now, expiresAt },
      });
  } catch {
    return;
  }
}

/**
 * Purge expired cache entries. Call periodically or on-demand.
 */
export async function purgeExpiredCache(): Promise<number> {
  if (!db) return 0;

  try {
    await db.delete(apiCache).where(lt(apiCache.expiresAt, new Date()));
    return 0;
  } catch {
    return 0;
  }
}
