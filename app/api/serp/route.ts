import { NextRequest, NextResponse } from "next/server";
import { hasCredentials } from "@/lib/dataforseo-server";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { checkRateLimit } from "@/lib/api-middleware";
import { getSerpResults as getMockSerp } from "@/lib/mock-data";
import { requireX402Payment } from "@/lib/x402-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { keyword, location_code = 2840, language_code = "en" } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    if (keyword.trim().length > 1000) {
      return NextResponse.json({ error: "keyword is too long" }, { status: 400 });
    }

    if (!hasCredentials()) {
      const mock = getMockSerp(keyword);
      const res = NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
      for (const [k, v] of Object.entries(pay.settleHeaders)) {
        res.headers.set(k, v);
      }
      return res;
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

    const response = NextResponse.json({ data: organicItems });
    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      response.headers.set(k, v);
    }
    return response;
  } catch (err: unknown) {
    console.error("SERP API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
