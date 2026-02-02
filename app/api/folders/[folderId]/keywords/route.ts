import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { folders, savedKeywords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { newId } from "@/lib/id";
import { requireAuth } from "@/lib/auth";

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

  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const folderRows = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);

    if (folderRows.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folderRows[0].userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { keywords } = (await request.json()) as { keywords: KeywordBody[] };

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "keywords array is required" }, { status: 400 });
    }

    for (const kw of keywords) {
      if (!kw || typeof kw.keyword !== "string") {
        return NextResponse.json({ error: "keyword is required" }, { status: 400 });
      }
      if (kw.keyword.trim().length === 0) {
        return NextResponse.json({ error: "keyword is required" }, { status: 400 });
      }
      if (kw.keyword.trim().length > 1000) {
        return NextResponse.json({ error: "keyword is too long" }, { status: 400 });
      }
    }

    // Check for existing keywords to avoid duplicates
    const existing = await db
      .select({ keyword: savedKeywords.keyword })
      .from(savedKeywords)
      .where(eq(savedKeywords.folderId, folderId));

    const existingSet = new Set(existing.map((e) => e.keyword));

    const toInsert = keywords
      .map((kw) => ({ ...kw, keyword: kw.keyword.trim() }))
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const folderRows = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);

    if (folderRows.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folderRows[0].userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { keyword } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    if (trimmedKeyword.length > 1000) {
      return NextResponse.json({ error: "keyword is too long" }, { status: 400 });
    }

    await db
      .delete(savedKeywords)
      .where(and(eq(savedKeywords.folderId, folderId), eq(savedKeywords.keyword, trimmedKeyword)));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Keywords DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
