import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { UserPreferences } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const preferencesSchema = z
  .object({
    defaultLocation: z.string().max(100).optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
  })
  .strict();

/**
 * GET /api/users/preferences?userId=xxx
 * Fetch user preferences.
 */
export async function GET(request: NextRequest) {
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
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const prefs = (rows[0]?.preferences as UserPreferences) ?? {};
    return NextResponse.json({ data: prefs });
  } catch (err) {
    console.error("Preferences GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json({ error: "preferences are required" }, { status: 400 });
    }

    const parsed = preferencesSchema.safeParse(preferences);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }

    // Fetch existing preferences and merge
    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const existing = (rows[0]?.preferences as UserPreferences) ?? {};
    const merged = { ...existing, ...parsed.data };

    await db
      .update(users)
      .set({ preferences: merged, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ data: merged });
  } catch (err) {
    console.error("Preferences PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
