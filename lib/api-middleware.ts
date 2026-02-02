import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "./rate-limit";

export async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const maxRequests = 30;
  const result = await rateLimit(`api:${ip}`, maxRequests, 60_000);

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
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}
