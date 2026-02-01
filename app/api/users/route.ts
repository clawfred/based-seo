import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/users
 * Upsert a user (called after auth).
 * Body: { id, email?, walletAddress? }
 */
export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id, email, walletAddress } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const now = new Date();

    await db
      .insert(users)
      .values({
        id,
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

    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("Users POST error:", err);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }
}
