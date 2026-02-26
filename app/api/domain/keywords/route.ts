import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { getRankedKeywords } from "@/lib/mock-data";
import { requireX402Payment } from "@/lib/x402-guard";
import type { DataForSEOResponse, RankedKeywordsResult } from "@/lib/dataforseo-types";

export interface CompetitorKeyword {
  keyword: string;
  position: number;
  volume: number;
  traffic: number;
  url: string;
  kd: number;
  cpc: number;
  intent: "Informational" | "Navigational" | "Commercial" | "Transactional";
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { domain, locationCode = 2840, limit = 1000, offset = 0 } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    // Normalize domain - remove protocol and www
    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .toLowerCase();

    if (normalizedDomain.length > 253) {
      return NextResponse.json({ error: "domain is too long" }, { status: 400 });
    }

    if (!hasCredentials()) {
      const mock = getRankedKeywords(normalizedDomain);
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: {
          keywords: mock,
          totalCount: mock.length,
        },
      });
    }

    const rankedRes = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live",
      [
        {
          target: normalizedDomain,
          language_name: "English",
          location_code: locationCode,
          limit,
          offset,
          order_by: ["keyword_data.keyword_info.search_volume,desc"],
        },
      ],
    );

    const rankedTask = (rankedRes as unknown as DataForSEOResponse<RankedKeywordsResult>)
      .tasks?.[0];

    if (rankedTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: rankedTask?.status_message || "Ranked keywords fetch failed" },
        { status: 502 },
      );
    }

    const result = rankedTask.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No ranked keywords data found" }, { status: 404 });
    }

    const intentMap: Record<string, CompetitorKeyword["intent"]> = {
      informational: "Informational",
      navigational: "Navigational",
      commercial: "Commercial",
      transactional: "Transactional",
    };

    const keywords: CompetitorKeyword[] = (result.items || []).map((item) => {
      const kd = item.keyword_data?.keyword_properties?.keyword_difficulty ?? 0;
      const ki = item.keyword_data?.keyword_info;
      const si = item.keyword_data?.search_intent_info;
      const serp = item.ranked_serp_element?.serp_item;

      const rawIntent = si?.main_intent || "informational";
      const intent = intentMap[rawIntent.toLowerCase()] || "Informational";

      return {
        keyword: item.keyword_data?.keyword || "",
        position: serp?.rank_absolute ?? serp?.rank_group ?? 0,
        volume: ki?.search_volume ?? 0,
        traffic: serp?.etv ?? 0,
        url: serp?.url || "",
        kd,
        cpc: ki?.cpc ?? 0,
        intent,
      };
    });

    const res = NextResponse.json({
      data: {
        keywords,
        totalCount: result.total_count ?? keywords.length,
      },
    });

    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Competitor keywords API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
