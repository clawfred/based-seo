import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./rate-limit";
import { verifyAuth } from "./auth";

export async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Try to get authenticated user first (user-based rate limiting)
  let rateLimitKey = "anonymous";
  let maxRequests = 30; // Lower limit for anonymous

  const user = await verifyAuth(request);
  if (user?.userId) {
    rateLimitKey = `user:${user.userId}`;
    maxRequests = 100; // Higher limit for authenticated users (not aggressive since it's paid)
  } else {
    // Fallback to IP-based for anonymous users
    // Use cf-connecting-ip (Cloudflare) or x-real-ip if available, otherwise x-forwarded-for
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    rateLimitKey = `ip:${ip}`;
  }

  const result = await rateLimit(rateLimitKey, maxRequests, 60_000);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfterMs: result.resetMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetMs / 1000)),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    );
  }

  return null;
}
