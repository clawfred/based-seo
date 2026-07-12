/**
 * GET /api/account?wallet=0x…
 *
 * Returns the caller's funding state: on-chain USDC allowance reconciled with
 * the ledger tab. Reading it also seeds the tab floor, so a just-approved
 * allowance becomes spendable on the next request without a separate sync call.
 *
 * The wallet address is supplied by the client from its connected wallet and
 * validated here; the account itself is keyed by the authenticated Privy user.
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { verifyAuth } from "@/lib/auth";
import { getAccountState } from "@/lib/billing/account";
import { NetworkConfigError } from "@/lib/x402/network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await verifyAuth(req);
  if (!user?.userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (!db) {
    return NextResponse.json({ error: "DB_UNAVAILABLE" }, { status: 503 });
  }

  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "A valid `wallet` query param is required." },
      { status: 400 },
    );
  }

  try {
    const state = await getAccountState(db, user.userId, wallet as `0x${string}`);
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof NetworkConfigError) {
      return NextResponse.json(
        { error: "PAYMENT_UNCONFIGURED", message: "Payments are not configured." },
        { status: 503 },
      );
    }
    console.error("[api/account] failed", err);
    return NextResponse.json(
      { error: "ACCOUNT_READ_FAILED", message: "Could not read on-chain allowance." },
      { status: 502 },
    );
  }
}
