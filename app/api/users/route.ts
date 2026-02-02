import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/users
 * Upsert a user (called after auth).
 * Body: { id, email?, walletAddress? }
 */
export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, walletAddress } = await request.json();

    const now = new Date();

    await db
      .insert(users)
      .values({
        id: userId,
        email: email ?? null,
        walletAddress: walletAddress ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: email ?? undefined,
          walletAddress: walletAddress ?? undefined,
          updatedAt: now,
        },
      });

    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("Users POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
