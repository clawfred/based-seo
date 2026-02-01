import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// NOTE (2026-02-01): The x402 payment middleware currently fails in Vercel Edge runtime
// (MIDDLEWARE_INVOCATION_FAILED), causing production 500s on keyword endpoints.
//
// Until x402 middleware is confirmed Edge-compatible, we bypass middleware and
// handle monetization at the route layer (or re-enable once fixed).
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/keywords/overview", "/api/keywords/ideas"],
};
