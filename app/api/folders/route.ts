import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { folders, savedKeywords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { newId } from "@/lib/id";

/**
 * GET /api/folders?userId=xxx
 * List all folders for a user (with keyword count).
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
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(desc(folders.createdAt));

    // Get keyword counts per folder
    const result = await Promise.all(
      userFolders.map(async (folder) => {
        const keywords = await db!
          .select()
          .from(savedKeywords)
          .where(eq(savedKeywords.folderId, folder.id));
        return {
          ...folder,
          keywordCount: keywords.length,
        };
      }),
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Folders GET error:", err);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

/**
 * POST /api/folders
 * Create a new folder.
 * Body: { userId, name }
 */
export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { userId, name } = await request.json();

    if (!userId || !name?.trim()) {
      return NextResponse.json({ error: "userId and name are required" }, { status: 400 });
    }

    const id = newId();
    const now = new Date();

    await db.insert(folders).values({
      id,
      userId,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      data: { id, userId, name: name.trim(), createdAt: now, updatedAt: now, keywordCount: 0 },
    });
  } catch (err) {
    console.error("Folders POST error:", err);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
