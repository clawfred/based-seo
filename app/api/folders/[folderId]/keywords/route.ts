import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedKeywords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { newId } from "@/lib/id";

type Params = { params: Promise<{ folderId: string }> };

interface KeywordBody {
  keyword: string;
  volume?: number;
  kd?: number;
  cpc?: number;
  competition?: number;
  intent?: string;
  trend?: number[];
  locationCode?: number;
}

/**
 * POST /api/folders/:folderId/keywords
 * Add keywords to a folder.
 * Body: { keywords: KeywordBody[] }
 */
export async function POST(request: NextRequest, { params }: Params) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { folderId } = await params;

  try {
    const { keywords } = (await request.json()) as { keywords: KeywordBody[] };

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "keywords array is required" }, { status: 400 });
    }

    // Check for existing keywords to avoid duplicates
    const existing = await db
      .select({ keyword: savedKeywords.keyword })
      .from(savedKeywords)
      .where(eq(savedKeywords.folderId, folderId));

    const existingSet = new Set(existing.map((e) => e.keyword));

    const toInsert = keywords
      .filter((kw) => !existingSet.has(kw.keyword))
      .map((kw) => ({
        id: newId(),
        folderId,
        keyword: kw.keyword,
        locationCode: kw.locationCode ?? null,
        volume: kw.volume ?? 0,
        kd: kw.kd ?? 0,
        cpc: kw.cpc ?? 0,
        competition: kw.competition ?? 0,
        intent: kw.intent ?? "Informational",
        trend: kw.trend ?? [],
        savedAt: new Date(),
      }));

    if (toInsert.length > 0) {
      await db.insert(savedKeywords).values(toInsert);
    }

    return NextResponse.json({
      data: { added: toInsert.length, skipped: keywords.length - toInsert.length },
    });
  } catch (err) {
    console.error("Keywords POST error:", err);
    return NextResponse.json({ error: "Failed to add keywords" }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/:folderId/keywords
 * Remove a keyword from a folder.
 * Body: { keyword: string }
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { folderId } = await params;

  try {
    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    await db
      .delete(savedKeywords)
      .where(and(eq(savedKeywords.folderId, folderId), eq(savedKeywords.keyword, keyword)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Keywords DELETE error:", err);
    return NextResponse.json({ error: "Failed to remove keyword" }, { status: 500 });
  }
}
