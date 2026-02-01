import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { getKeywordIdeas, getKeywordMetrics, getSerpResults } from "@/lib/mock-data";
import { requireX402Payment } from "@/lib/x402-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { keyword, location_code = 2840, language_code = "en" } = await request.json();

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    if (!hasCredentials()) {
      const mock = {
        overview: getKeywordMetrics(keyword),
        ideas: getKeywordIdeas(keyword),
        serp: getSerpResults(keyword),
      };
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
    }

    const [overviewRes, ideasRes, serpRes] = await Promise.all([
      cachedDataforseoFetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live",
        [{ keywords: [keyword], location_code, language_code }],
      ),
      cachedDataforseoFetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live",
        [{ keyword, location_code, language_code, limit: 50 }],
      ),
      cachedDataforseoFetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", [
        { keyword, location_code, language_code },
      ]),
    ]);

    const overviewTask = (overviewRes as any).tasks?.[0] as any;
    const ideasTask = (ideasRes as any).tasks?.[0] as any;
    const serpTask = (serpRes as any).tasks?.[0] as any;

    if (overviewTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: overviewTask?.status_message || "Overview fetch failed" },
        { status: 502 },
      );
    }

    const overviewItem = overviewTask.result?.[0]?.items?.[0] as any;
    if (!overviewItem) {
      return NextResponse.json({ error: "No overview data found" }, { status: 404 });
    }

    const ki = overviewItem.keyword_info || {};
    const kp = overviewItem.keyword_properties || {};
    const si = overviewItem.search_intent_info || {};

    const intentMap: Record<string, string> = {
      informational: "Informational",
      navigational: "Navigational",
      commercial: "Commercial",
      transactional: "Transactional",
    };
    const rawIntent = si?.main_intent || "informational";
    const intent = intentMap[rawIntent.toLowerCase()] || "Informational";

    const monthly = ki?.monthly_searches || [];
    const trend = monthly
      .slice(0, 12)
      .reverse()
      .map((m: { search_volume?: number }) => m.search_volume ?? 0);

    const overview = {
      keyword: overviewItem.keyword,
      volume: ki?.search_volume ?? 0,
      kd: kp?.keyword_difficulty ?? 0,
      cpc: ki?.cpc ?? 0,
      competition: ki?.competition ?? 0,
      intent: intent as "Informational" | "Navigational" | "Commercial" | "Transactional",
      trend,
      globalVolume: [{ country: "Selected Location", volume: ki?.search_volume ?? 0 }],
    };

    const ideas =
      ideasTask?.status_code === 20000
        ? (ideasTask.result?.[0]?.items || []).slice(0, 50).map((idea: any) => ({
            keyword: idea.keyword_data?.keyword || "",
            volume: idea.keyword_data?.keyword_info?.search_volume || 0,
            kd: idea.keyword_data?.keyword_properties?.keyword_difficulty || 0,
            type: idea.keyword_data?.keyword || "",
          }))
        : [];

    const serp =
      serpTask?.status_code === 20000
        ? (serpTask.result?.[0]?.items || [])
            .filter((item: any) => item.type === "organic")
            .slice(0, 10)
            .map((item: any, index: number) => ({
              position: index + 1,
              url: item.url || "",
              title: item.title || "",
              description: item.description || "",
            }))
        : [];

    const res = NextResponse.json({
      data: {
        overview,
        ideas,
        serp,
      },
    });

    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Keyword overview API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
