import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UserPreferences } from "@/db/schema";

/**
 * GET /api/users/preferences?userId=xxx
 * Fetch user preferences.
 */
export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const prefs = (rows[0]?.preferences as UserPreferences) ?? {};
    return NextResponse.json({ data: prefs });
  } catch (err) {
    console.error("Preferences GET error:", err);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

/**
 * PATCH /api/users/preferences
 * Update user preferences (partial merge).
 * Body: { userId, preferences: { defaultLocation?, theme? } }
 */
export async function PATCH(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { userId, preferences } = await request.json();

    if (!userId || !preferences) {
      return NextResponse.json({ error: "userId and preferences are required" }, { status: 400 });
    }

    // Fetch existing preferences and merge
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const existing = (rows[0]?.preferences as UserPreferences) ?? {};
    const merged = { ...existing, ...preferences };

    await db
      .update(users)
      .set({ preferences: merged, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ data: merged });
  } catch (err) {
    console.error("Preferences PATCH error:", err);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
