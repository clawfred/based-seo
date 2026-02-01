import { NextResponse } from "next/server";
import { hasCredentials } from "@/lib/dataforseo-server";

/**
 * GET /api/health
 * Public health check endpoint.
 * Reports DataForSEO credential status and basic connectivity.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    dataforseo: {
      credentialsConfigured: hasCredentials(),
    },
    database: {
      configured: !!process.env.DATABASE_URL,
    },
  };

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { apiCache } = await import("@/db/schema");
      if (db) {
        await db.select().from(apiCache).limit(1);
        checks.database = { ...(checks.database as object), connected: true };
      } else {
        checks.database = { ...(checks.database as object), connected: false };
        checks.status = "degraded";
      }
    } catch {
      checks.database = { ...(checks.database as object), connected: false };
      checks.status = "degraded";
    }
  }

  if (!hasCredentials()) {
    checks.status = "degraded";
    checks.dataforseo = {
      ...(checks.dataforseo as object),
      note: "Using mock data — DataForSEO credentials not configured",
    };
  }

  const statusCode = checks.status === "ok" ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
