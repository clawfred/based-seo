import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Distributed rate limiting.
 *
 * Two bugs shaped this file:
 *
 *  1. The previous Redis limiter was constructed once with a hardcoded
 *     `slidingWindow(30, "1 m")` and never received the caller's `maxRequests`,
 *     so authenticated users silently got the anonymous limit. Limiters are now
 *     memoised per (limit, window).
 *
 *  2. On a Redis error it fell back to a module-level `Map`. Every serverless
 *     instance has its own, so the effective limit became `limit x instances` —
 *     it failed *open*, on the paid endpoints, precisely when limits matter.
 *     Callers now choose: `failOpen` for cosmetic limits, fail-closed (default)
 *     for anything that costs us money.
 */

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetMs: number;
  /** True when Redis was unreachable and we could not make a real decision. */
  readonly degraded: boolean;
}

let redis: Redis | null = null;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis ??= new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

function getLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const key = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: true,
      prefix: "@based-seo/ratelimit",
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export interface RateLimitOptions {
  /**
   * Allow the request through when Redis is unavailable. Only for limits whose
   * purpose is politeness. Anything that spends money must fail closed.
   */
  readonly failOpen?: boolean;
}

export async function rateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const limiter = getLimiter(maxRequests, windowMs);

  if (!limiter) {
    return unavailable(maxRequests, windowMs, options.failOpen ?? false);
  }

  try {
    const { success, remaining, reset } = await limiter.limit(key);
    return {
      allowed: success,
      remaining,
      resetMs: Math.max(0, reset - Date.now()),
      degraded: false,
    };
  } catch (error) {
    console.error("[rate-limit] Redis unavailable", error);
    return unavailable(maxRequests, windowMs, options.failOpen ?? false);
  }
}

function unavailable(maxRequests: number, windowMs: number, failOpen: boolean): RateLimitResult {
  return {
    allowed: failOpen,
    remaining: failOpen ? maxRequests : 0,
    resetMs: windowMs,
    degraded: true,
  };
}
