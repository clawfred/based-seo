import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

let redis: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  if (!rateLimiter) {
    rateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      analytics: true,
      prefix: "@based-seo/ratelimit",
    });
  }

  return rateLimiter;
}

interface InMemoryEntry {
  timestamps: number[];
}

const inMemoryStore = new Map<string, InMemoryEntry>();

function inMemoryRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = inMemoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    inMemoryStore.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + windowMs - now,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetMs: windowMs,
  };
}

export async function rateLimit(
  key: string,
  maxRequests: number = 20,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const limiter = getRateLimiter();

  if (!limiter) {
    return inMemoryRateLimit(key, maxRequests, windowMs);
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);

    return {
      allowed: success,
      remaining: remaining,
      resetMs: reset - Date.now(),
    };
  } catch (error) {
    console.error("Redis rate limit error, falling back to in-memory:", error);
    return inMemoryRateLimit(key, maxRequests, windowMs);
  }
}
