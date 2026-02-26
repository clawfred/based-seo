import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { getKeywordGapMockData } from "@/lib/mock-data";
import { requireX402Payment } from "@/lib/x402-guard";
import type {
  DataForSEOResponse,
  DomainIntersectionResult,
} from "@/lib/dataforseo-types";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { yourDomain, competitors, locationCode = 2840 } = await request.json();

    if (!yourDomain || typeof yourDomain !== "string") {
      return NextResponse.json({ error: "yourDomain is required" }, { status: 400 });
    }

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json({ error: "competitors array is required" }, { status: 400 });
    }

    if (competitors.length > 3) {
      return NextResponse.json({ error: "Maximum 3 competitors allowed" }, { status: 400 });
    }

    // Normalize domains (strip protocol, www, trailing slashes)
    const normalizeDomain = (d: string) =>
      d.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").toLowerCase();

    const yourDomainNorm = normalizeDomain(yourDomain);
    const competitorNorms = competitors.map(normalizeDomain).filter(Boolean);

    if (!yourDomainNorm) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    if (competitorNorms.length === 0) {
      return NextResponse.json({ error: "At least one valid competitor domain required" }, { status: 400 });
    }

    if (!hasCredentials()) {
      const mock = getKeywordGapMockData(yourDomainNorm, competitorNorms);
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
    }

    // Build targets array: [yourDomain, competitor1, competitor2, ...]
    const targets = [yourDomainNorm, ...competitorNorms];
    
    // Build intersections object for DataForSEO
    // We want keywords where competitors rank (not necessarily your domain)
    // intersections: {"1": ["2","3"]} means domain at index 1 intersects with domains at 2 and 3
    // But for gap analysis, we want ALL keywords from the intersection
    // Using empty intersections {} returns all keywords from all domains
    const intersections: Record<string, string[]> = {};

    const gapRes = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_intersection/live",
      [{
        targets,
        language_name: "English",
        location_code: locationCode,
        limit: 1000,
        intersections,
        item_types: ["organic"],
        include_serp_info: true,
        include_clickstream_data: false,
      }],
    );

    const gapTask = (gapRes as unknown as DataForSEOResponse<DomainIntersectionResult>)
      .tasks?.[0];

    if (gapTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: gapTask?.status_message || "Domain intersection fetch failed" },
        { status: 502 },
      );
    }

    const items = gapTask.result?.[0]?.items || [];

    // Transform results into a normalized format
    const keywords = items.map((item) => {
      // Extract positions for each domain
      const positions: Record<string, number | null> = {};
      
      for (let i = 0; i < targets.length; i++) {
        const targetKey = `target${i + 1}`;
        const intersection = item.intersection_result?.[targetKey];
        positions[targets[i]] = intersection?.etv !== undefined 
          ? (intersection.rank_absolute ?? null)
          : null;
      }

      // Get keyword info from the first available intersection
      const firstIntersection = item.intersection_result?.target1 || 
                                item.intersection_result?.target2 ||
                                item.intersection_result?.target3;

      return {
        keyword: item.keyword,
        yourPosition: positions[yourDomainNorm],
        competitorPositions: competitorNorms.reduce((acc, comp) => {
          acc[comp] = positions[comp];
          return acc;
        }, {} as Record<string, number | null>),
        volume: item.keyword_data?.keyword_info?.search_volume ?? 0,
        kd: item.keyword_data?.keyword_properties?.keyword_difficulty ?? 0,
        cpc: item.keyword_data?.keyword_info?.cpc ?? 0,
        trafficPotential: firstIntersection?.etv ?? 0,
        competition: item.keyword_data?.keyword_info?.competition ?? 0,
      };
    });

    const res = NextResponse.json({
      data: {
        yourDomain: yourDomainNorm,
        competitors: competitorNorms,
        keywords,
        totalCount: gapTask.result?.[0]?.total_count ?? keywords.length,
      },
    });

    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Keyword gap API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
