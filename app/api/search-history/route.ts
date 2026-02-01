import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { searchHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { newId } from "@/lib/id";

/**
 * GET /api/search-history?userId=xxx&limit=20
 * Get recent searches for a user.
 */
export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "20"), 100);

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const history = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(limit);

    return NextResponse.json({ data: history });
  } catch (err) {
    console.error("Search history GET error:", err);
    return NextResponse.json({ error: "Failed to fetch search history" }, { status: 500 });
  }
}

/**
 * POST /api/search-history
 * Record a search.
 * Body: { userId, query, tool, locationCode? }
 */
export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { userId, query, tool = "overview", locationCode } = await request.json();

    if (!userId || !query) {
      return NextResponse.json({ error: "userId and query are required" }, { status: 400 });
    }

    await db.insert(searchHistory).values({
      id: newId(),
      userId,
      query: query.trim(),
      tool,
      locationCode: locationCode ?? null,
      searchedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Search history POST error:", err);
    return NextResponse.json({ error: "Failed to record search" }, { status: 500 });
  }
}
