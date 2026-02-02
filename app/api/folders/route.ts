import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { folders, savedKeywords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { newId } from "@/lib/id";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/folders?userId=xxx
 * List all folders for a user (with keyword count).
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  let userId: string;
  try {
    userId = await requireAuth(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: "name is too long" }, { status: 400 });
    }

    const id = newId();
    const now = new Date();

    await db.insert(folders).values({
      id,
      userId,
      name: trimmedName,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      data: { id, userId, name: trimmedName, createdAt: now, updatedAt: now, keywordCount: 0 },
    });
  } catch (err) {
    console.error("Folders POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
