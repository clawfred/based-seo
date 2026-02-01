import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { getKeywordIdeas as getMockIdeas } from "@/lib/mock-data";
import { requireX402Payment } from "@/lib/x402-guard";

interface KeywordIdeaItem {
  keyword: string;
  volume: number;
  kd: number;
  cpc: number;
  competition: number;
  intent: string;
  type: "related" | "variation" | "question";
  trend: number[];
}

function mapIntent(raw: string | undefined): string {
  const map: Record<string, string> = {
    informational: "Informational",
    navigational: "Navigational",
    commercial: "Commercial",
    transactional: "Transactional",
  };
  return map[(raw || "informational").toLowerCase()] || "Informational";
}

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
      const mock = getMockIdeas(keyword);
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
    }

    // Fire both requests in parallel
    const [relatedRes, suggestionsRes] = await Promise.allSettled([
      cachedDataforseoFetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live",
        [{ keyword, location_code, language_code, limit: 20 }],
      ),
      cachedDataforseoFetch(
        "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live",
        [{ keyword, location_code, language_code, limit: 20 }],
      ),
    ]);

    const ideas: KeywordIdeaItem[] = [];
    const seen = new Set<string>();

    // Process related keywords — items have { keyword_data: { keyword, keyword_info, ... } }
    if (relatedRes.status === "fulfilled") {
      const task = (relatedRes.value as any).tasks?.[0];
      if (task?.status_code === 20000 && task.result?.[0]?.items) {
        for (const item of task.result[0].items) {
          const kd = item.keyword_data;
          if (!kd || seen.has(kd.keyword)) continue;
          seen.add(kd.keyword);

          const monthly = kd.keyword_info?.monthly_searches || [];
          ideas.push({
            keyword: kd.keyword,
            volume: kd.keyword_info?.search_volume ?? 0,
            kd: kd.keyword_properties?.keyword_difficulty ?? 0,
            cpc: kd.keyword_info?.cpc ?? 0,
            competition: kd.keyword_info?.competition ?? 0,
            intent: mapIntent(kd.search_intent_info?.main_intent),
            type: "related",
            trend: monthly
              .slice(0, 12)
              .reverse()
              .map((m: any) => m.search_volume ?? 0),
          });
        }
      }
    }

    // Process suggestions — items have { keyword, keyword_info, keyword_properties, ... } directly
    if (suggestionsRes.status === "fulfilled") {
      const task = (suggestionsRes.value as any).tasks?.[0];
      if (task?.status_code === 20000 && task.result?.[0]?.items) {
        for (const item of task.result[0].items) {
          if (seen.has(item.keyword)) continue;
          seen.add(item.keyword);

          const isQuestion = /^(what|how|why|when|where|which|who|can|does|is|are|do)\b/i.test(
            item.keyword,
          );
          const monthly = item.keyword_info?.monthly_searches || [];

          ideas.push({
            keyword: item.keyword,
            volume: item.keyword_info?.search_volume ?? 0,
            kd: item.keyword_properties?.keyword_difficulty ?? 0,
            cpc: item.keyword_info?.cpc ?? 0,
            competition: item.keyword_info?.competition ?? 0,
            intent: mapIntent(item.search_intent_info?.main_intent),
            type: isQuestion ? "question" : "variation",
            trend: monthly
              .slice(0, 12)
              .reverse()
              .map((m: any) => m.search_volume ?? 0),
          });
        }
      }
    }

    // Sort by volume descending
    ideas.sort((a, b) => b.volume - a.volume);

    const res = NextResponse.json({ data: ideas });

    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Keyword ideas API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
