import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { searchHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { newId } from "@/lib/id";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/search-history?userId=xxx&limit=20
 * Get recent searches for a user.
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

  const limitRaw = request.nextUrl.searchParams.get("limit") || "20";
  const parsedLimit = Number.parseInt(limitRaw, 10);
  if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
    return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
  }
  if (parsedLimit > 100) {
    return NextResponse.json({ error: "limit too large" }, { status: 400 });
  }
  const limit = parsedLimit;

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query, tool = "overview", locationCode } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    if (trimmedQuery.length > 1000) {
      return NextResponse.json({ error: "query is too long" }, { status: 400 });
    }

    await db.insert(searchHistory).values({
      id: newId(),
      userId,
      query: trimmedQuery,
      tool,
      locationCode: locationCode ?? null,
      searchedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Search history POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
