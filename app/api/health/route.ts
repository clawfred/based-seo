import { NextResponse } from "next/server";
/**
 * GET /api/health
 * Public health check endpoint.
 * Reports minimal health status.
 */
export async function GET() {
  let status: "ok" | "degraded" = "ok";

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/db");
      const { apiCache } = await import("@/db/schema");
      if (db) {
        await db.select().from(apiCache).limit(1);
      } else {
        status = "degraded";
      }
    } catch {
      status = "degraded";
    }
  } else {
    status = "degraded";
  }

  const statusCode = status === "ok" ? 200 : 503;
  return NextResponse.json({ status }, { status: statusCode });
}
