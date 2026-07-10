import { NextResponse, type NextRequest } from "next/server";

import { verifyAuth } from "./auth";
import { rateLimit } from "./rate-limit";

const ANONYMOUS_LIMIT = 30;
const AUTHENTICATED_LIMIT = 100;
const WINDOW_MS = 60_000;

/**
 * Rate limit a request, returning a response when it should not proceed.
 *
 * Fails closed: if Redis is unreachable we return 503 rather than waving traffic
 * through. Every request past this point can spend money — ours at DataForSEO,
 * or the caller's on-chain — so an unmetered in-memory fallback (which on
 * Vercel is per-instance, and therefore no limit at all) is worse than a brief
 * outage.
 */
export async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Escape hatch for local development, where Upstash is usually not configured
  // and fail-closed would 503 every request. Deliberately an explicit opt-in:
  // inferring it from NODE_ENV is how a production deploy ends up unmetered.
  if (process.env.RATE_LIMIT_DISABLED === "1") {
    if (process.env.NODE_ENV === "production") {
      console.warn("[rate-limit] DISABLED in production. Every paid endpoint is unmetered.");
    }
    return null;
  }

  const user = await verifyAuth(request);

  const [key, limit] = user?.userId
    ? ([`user:${user.userId}`, AUTHENTICATED_LIMIT] as const)
    : ([`ip:${clientIp(request)}`, ANONYMOUS_LIMIT] as const);

  const result = await rateLimit(key, limit, WINDOW_MS);

  if (result.degraded) {
    return NextResponse.json(
      {
        error: "RATE_LIMITER_UNAVAILABLE",
        message: "Rate limiting is temporarily unavailable. Please retry shortly.",
      },
      { status: 503, headers: { "Retry-After": "5" } },
    );
  }

  if (!result.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests.", retryAfterMs: result.resetMs },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetMs / 1000)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    );
  }

  return null;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
