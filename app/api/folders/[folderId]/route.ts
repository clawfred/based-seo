import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { folders, savedKeywords } from "@/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ folderId: string }> };

/**
 * GET /api/folders/:folderId
 * Get a folder with all its keywords.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { folderId } = await params;

  try {
    const folderRows = await db.select().from(folders).where(eq(folders.id, folderId)).limit(1);

    if (folderRows.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const keywords = await db
      .select()
      .from(savedKeywords)
      .where(eq(savedKeywords.folderId, folderId));

    return NextResponse.json({
      data: {
        ...folderRows[0],
        keywords: keywords.map((kw) => ({
          id: kw.id,
          keyword: kw.keyword,
          volume: kw.volume,
          kd: kw.kd,
          cpc: kw.cpc,
          competition: kw.competition,
          intent: kw.intent,
          trend: kw.trend,
          savedAt: kw.savedAt,
        })),
      },
    });
  } catch (err) {
    console.error("Folder GET error:", err);
    return NextResponse.json({ error: "Failed to fetch folder" }, { status: 500 });
  }
}

/**
 * PATCH /api/folders/:folderId
 * Rename a folder.
 * Body: { name }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { folderId } = await params;

  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    await db
      .update(folders)
      .set({ name: name.trim(), updatedAt: new Date() })
      .where(eq(folders.id, folderId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Folder PATCH error:", err);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}

/**
 * DELETE /api/folders/:folderId
 * Delete a folder (cascade deletes keywords).
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { folderId } = await params;

  try {
    await db.delete(folders).where(eq(folders.id, folderId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Folder DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
