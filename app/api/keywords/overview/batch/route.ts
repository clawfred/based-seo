import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { getKeywordIdeas, getKeywordMetrics, getSerpResults } from "@/lib/mock-data";
import { requireX402Payment } from "@/lib/x402-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAX_KEYWORDS = 25;

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // We need keywords before charging so we can validate input.
    const body = await request.json();
    const { keywords, location_code = 2840, language_code = "en" } = body ?? {};

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: "keywords is required" }, { status: 400 });
    }

    const headerCount = request.headers.get("x-keyword-count");
    const parsedHeaderCount = headerCount ? Number.parseInt(headerCount, 10) : NaN;
    if (!Number.isFinite(parsedHeaderCount) || parsedHeaderCount <= 0) {
      return NextResponse.json({ error: "x-keyword-count header is required" }, { status: 400 });
    }

    if (parsedHeaderCount !== keywords.length) {
      return NextResponse.json({ error: "keyword count mismatch" }, { status: 400 });
    }

    if (keywords.length > MAX_KEYWORDS) {
      return NextResponse.json(
        { error: `Too many keywords (max ${MAX_KEYWORDS})` },
        { status: 400 },
      );
    }

    for (const keyword of keywords) {
      if (typeof keyword !== "string") {
        return NextResponse.json({ error: "keywords must be strings" }, { status: 400 });
      }
      if (keyword.trim().length > 1000) {
        return NextResponse.json({ error: "keyword is too long" }, { status: 400 });
      }
    }

    // Require payment once for the entire batch.
    // Dynamic pricing is handled in routes config based on x-keyword-count header.
    const pay = await requireX402Payment(request);
    if (!pay.ok) return pay.response;

    // Normalize/clean keywords
    const cleaned = keywords
      .map((k: unknown) => (typeof k === "string" ? k.trim().toLowerCase() : ""))
      .filter(Boolean);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: "keywords is required" }, { status: 400 });
    }

    // Mock mode
    if (!hasCredentials()) {
      const data = cleaned.map((keyword: string) => ({
        overview: getKeywordMetrics(keyword),
        ideas: getKeywordIdeas(keyword),
        serp: getSerpResults(keyword),
      }));

      const res = NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data,
      });

      for (const [k, v] of Object.entries(pay.settleHeaders)) {
        res.headers.set(k, v);
      }

      return res;
    }

    // 1) Overview: can be fetched in one call with multiple keywords.
    const overviewRes = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live",
      [{ keywords: cleaned, location_code, language_code }],
    );

    const overviewTask = (overviewRes as any).tasks?.[0] as any;
    if (overviewTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: overviewTask?.status_message || "Overview fetch failed" },
        { status: 502 },
      );
    }

    const overviewItems = (overviewTask.result?.[0]?.items || []) as any[];
    const overviewByKeyword = new Map<string, any>();
    for (const item of overviewItems) {
      if (item?.keyword) overviewByKeyword.set(String(item.keyword).toLowerCase(), item);
    }

    // 2) Ideas + SERP: per keyword (can be parallel after the single payment).
    const ideasSettled = await Promise.allSettled(
      cleaned.map((keyword: string) =>
        cachedDataforseoFetch(
          "https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live",
          [{ keyword, location_code, language_code, limit: 50 }],
        ),
      ),
    );

    const serpSettled = await Promise.allSettled(
      cleaned.map((keyword: string) =>
        cachedDataforseoFetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", [
          { keyword, location_code, language_code },
        ]),
      ),
    );

    const data = cleaned.map((keyword: string, i: number) => {
      const overviewItem = overviewByKeyword.get(keyword);
      if (!overviewItem) {
        return {
          keyword,
          error: "No overview data found",
        };
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
      const intent = intentMap[String(rawIntent).toLowerCase()] || "Informational";

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

      const ideasRes = ideasSettled[i];
      const ideasTask =
        ideasRes.status === "fulfilled" ? ((ideasRes.value as any).tasks?.[0] as any) : null;

      const ideas =
        ideasTask?.status_code === 20000
          ? (ideasTask.result?.[0]?.items || []).slice(0, 50).map((idea: any) => ({
              keyword: idea.keyword_data?.keyword || "",
              volume: idea.keyword_data?.keyword_info?.search_volume || 0,
              kd: idea.keyword_data?.keyword_properties?.keyword_difficulty || 0,
              type: idea.keyword_data?.keyword || "",
            }))
          : [];

      const serpRes = serpSettled[i];
      const serpTask =
        serpRes.status === "fulfilled" ? ((serpRes.value as any).tasks?.[0] as any) : null;

      const serp =
        serpTask?.status_code === 20000
          ? (serpTask.result?.[0]?.items || [])
              .filter((item: any) => item.type === "organic")
              .slice(0, 10)
              .map((item: any, index: number) => {
                let domain = "";
                try {
                  domain = item.url ? new URL(item.url).hostname.replace(/^www\./, "") : "";
                } catch {
                  domain = "";
                }
                return {
                  position: index + 1,
                  url: item.url || "",
                  domain,
                  title: item.title || "",
                  description: item.description || "",
                };
              })
          : [];

      return {
        overview,
        ideas,
        serp,
      };
    });

    const res = NextResponse.json({ data });
    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }
    return res;
  } catch (err: unknown) {
    console.error("Keyword overview batch API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
