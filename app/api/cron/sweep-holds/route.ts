/**
 * GET /api/cron/sweep-holds
 *
 * Releases balance holds whose deadline passed - the backstop for a function
 * that died between holding funds and capturing them. Idempotent and safe to run
 * often; the status-guarded release means a sweep racing a slow success has
 * exactly one winner.
 *
 * This is only a backstop. The balance rail already sweeps each account's own
 * expired holds on its next request, so a daily cron (all Vercel Hobby allows)
 * is enough - it just catches accounts that never come back. On Pro you can
 * raise the cadence in vercel.json.
 *
 * Protected by CRON_SECRET so only the scheduler can trigger it.
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { sweepExpiredHolds } from "@/lib/billing/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!db) return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });

  const released = await sweepExpiredHolds(db);
  return NextResponse.json({ released });
}
