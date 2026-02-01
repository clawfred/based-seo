import { NextRequest, NextResponse } from "next/server";
import { hasCredentials } from "@/lib/dataforseo-server";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { checkRateLimit } from "@/lib/api-middleware";
import { getSerpResults as getMockSerp } from "@/lib/mock-data";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { keyword, location_code = 2840, language_code = "en" } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    if (!hasCredentials()) {
      const mock = getMockSerp(keyword);
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
    }

    const res: any = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/serp/google/organic/live/regular",
      [{ keyword, location_code, language_code, depth: 10 }],
    );

    const task = res.tasks?.[0];
    if (!task || task.status_code !== 20000 || !task.result?.[0]) {
      return NextResponse.json(
        { error: task?.status_message || "No SERP results returned" },
        { status: 502 },
      );
    }

    const items = task.result[0].items || [];
    const organicItems = items
      .filter((item: any) => item.type === "organic")
      .slice(0, 10)
      .map((item: any, idx: number) => ({
        position: idx + 1,
        url: item.url,
        domain: item.domain,
        title: item.title,
      }));

    return NextResponse.json({ data: organicItems });
  } catch (err: unknown) {
    console.error("SERP API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
