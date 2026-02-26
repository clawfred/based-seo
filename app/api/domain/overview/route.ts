import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { requireX402Payment } from "@/lib/x402-guard";
import type { DataForSEOResponse } from "@/lib/dataforseo-types";

interface DomainRankItem {
  target: string;
  location_code: number;
  language_code: string;
  metrics?: {
    organic?: {
      pos_1?: number;
      pos_2_3?: number;
      pos_4_10?: number;
      pos_11_20?: number;
      pos_21_30?: number;
      pos_31_40?: number;
      pos_41_50?: number;
      pos_51_60?: number;
      pos_61_70?: number;
      pos_71_80?: number;
      pos_81_90?: number;
      pos_91_100?: number;
      etv?: number;
      impressions_etv?: number;
      count?: number;
      estimated_paid_traffic_cost?: number;
      is_new?: number;
      is_up?: number;
      is_down?: number;
      is_lost?: number;
    };
    paid?: {
      count?: number;
      etv?: number;
      impressions_etv?: number;
      estimated_paid_traffic_cost?: number;
    };
  };
  total_metrics?: {
    organic?: {
      count?: number;
      etv?: number;
    };
  };
  main_domain_rank?: number;
  rank?: number;
  backlinks?: number;
  metrics_history?: Array<{
    year: number;
    month: number;
    metrics?: {
      organic?: {
        count?: number;
        etv?: number;
        pos_1?: number;
        pos_2_3?: number;
        pos_4_10?: number;
        pos_11_20?: number;
      };
    };
  }>;
  top_keywords?: Array<{
    keyword: string;
    position?: number;
    search_volume?: number;
    traffic?: number;
    traffic_share?: number;
    cpc?: number;
    keyword_difficulty?: number;
  }>;
}

interface DomainRankOverviewResult {
  se_type: string;
  target: string;
  location_code: number;
  language_code: string;
  total_count: number;
  items_count: number;
  items: DomainRankItem[] | null;
}

// Mock data for when DataForSEO credentials are not configured
function getMockDomainData(domain: string) {
  const generateTrend = () => {
    const base = Math.floor(Math.random() * 50000) + 10000;
    return Array.from({ length: 12 }, (_, i) => ({
      year: 2025,
      month: i + 1,
      etv: Math.floor(base * (1 + (Math.random() - 0.5) * 0.3)),
    }));
  };

  return {
    domain,
    rank: Math.floor(Math.random() * 100000) + 1000,
    organicTraffic: Math.floor(Math.random() * 500000) + 10000,
    organicKeywords: Math.floor(Math.random() * 50000) + 1000,
    backlinks: Math.floor(Math.random() * 1000000) + 5000,
    avgPosition: Math.floor(Math.random() * 30) + 5,
    trafficCost: Math.floor(Math.random() * 100000) + 1000,
    trafficHistory: generateTrend(),
    topKeywords: [
      { keyword: `${domain} login`, position: 1, volume: 12000, trafficShare: 15.2 },
      { keyword: `${domain} pricing`, position: 2, volume: 8500, trafficShare: 10.5 },
      { keyword: `${domain} review`, position: 3, volume: 6200, trafficShare: 7.8 },
      { keyword: `${domain} alternative`, position: 4, volume: 4800, trafficShare: 5.9 },
      { keyword: `${domain.split(".")[0]} tool`, position: 5, volume: 3600, trafficShare: 4.5 },
      { keyword: `best ${domain.split(".")[0]}`, position: 6, volume: 2900, trafficShare: 3.6 },
      {
        keyword: `how to use ${domain.split(".")[0]}`,
        position: 8,
        volume: 2100,
        trafficShare: 2.6,
      },
      { keyword: `${domain.split(".")[0]} features`, position: 9, volume: 1800, trafficShare: 2.2 },
      {
        keyword: `${domain.split(".")[0]} vs competitor`,
        position: 12,
        volume: 1500,
        trafficShare: 1.9,
      },
      { keyword: `${domain.split(".")[0]} free`, position: 15, volume: 1200, trafficShare: 1.5 },
    ],
  };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { domain, locationCode = 2840 } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    // Clean domain: remove protocol and trailing slashes
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!cleanDomain || cleanDomain.length > 253) {
      return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
    }

    if (!hasCredentials()) {
      const mock = getMockDomainData(cleanDomain);
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
    }

    // Call DataForSEO domain rank overview API
    const overviewRes = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/domain_rank_overview/live",
      [{ target: cleanDomain, language_name: "English", location_code: locationCode }],
    );

    const overviewResponse = overviewRes as unknown as DataForSEOResponse<DomainRankOverviewResult>;
    const overviewTask = overviewResponse.tasks?.[0];

    if (overviewTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: overviewTask?.status_message || "Domain overview fetch failed" },
        { status: 502 },
      );
    }

    const item = overviewTask.result?.[0]?.items?.[0];
    if (!item) {
      return NextResponse.json({ error: "No data found for this domain" }, { status: 404 });
    }

    const organic = item.metrics?.organic || {};
    const history = item.metrics_history || [];

    // Calculate total organic keywords across all positions
    const organicKeywords =
      organic.count ||
      (organic.pos_1 || 0) +
        (organic.pos_2_3 || 0) +
        (organic.pos_4_10 || 0) +
        (organic.pos_11_20 || 0) +
        (organic.pos_21_30 || 0) +
        (organic.pos_31_40 || 0) +
        (organic.pos_41_50 || 0) +
        (organic.pos_51_60 || 0) +
        (organic.pos_61_70 || 0) +
        (organic.pos_71_80 || 0) +
        (organic.pos_81_90 || 0) +
        (organic.pos_91_100 || 0);

    // Calculate weighted average position
    const positionWeights = [
      { positions: organic.pos_1 || 0, weight: 1 },
      { positions: organic.pos_2_3 || 0, weight: 2.5 },
      { positions: organic.pos_4_10 || 0, weight: 7 },
      { positions: organic.pos_11_20 || 0, weight: 15 },
      { positions: organic.pos_21_30 || 0, weight: 25 },
      { positions: organic.pos_31_40 || 0, weight: 35 },
      { positions: organic.pos_41_50 || 0, weight: 45 },
      { positions: organic.pos_51_60 || 0, weight: 55 },
      { positions: organic.pos_61_70 || 0, weight: 65 },
      { positions: organic.pos_71_80 || 0, weight: 75 },
      { positions: organic.pos_81_90 || 0, weight: 85 },
      { positions: organic.pos_91_100 || 0, weight: 95 },
    ];

    const totalWeighted = positionWeights.reduce((sum, pw) => sum + pw.positions * pw.weight, 0);
    const totalPositions = positionWeights.reduce((sum, pw) => sum + pw.positions, 0);
    const avgPosition = totalPositions > 0 ? Math.round(totalWeighted / totalPositions) : 0;

    // Format traffic history
    const trafficHistory = history
      .slice(0, 12)
      .map((h) => ({
        year: h.year,
        month: h.month,
        etv: h.metrics?.organic?.etv || 0,
        keywords: h.metrics?.organic?.count || 0,
      }))
      .reverse();

    // Format top keywords if available
    const topKeywords = (item.top_keywords || []).slice(0, 10).map((kw) => ({
      keyword: kw.keyword,
      position: kw.position || 0,
      volume: kw.search_volume || 0,
      trafficShare: kw.traffic_share ? kw.traffic_share * 100 : 0,
      cpc: kw.cpc || 0,
      difficulty: kw.keyword_difficulty || 0,
    }));

    const data = {
      domain: cleanDomain,
      rank: item.rank || item.main_domain_rank || 0,
      organicTraffic: organic.etv || 0,
      organicKeywords,
      backlinks: item.backlinks || 0,
      avgPosition,
      trafficCost: organic.estimated_paid_traffic_cost || 0,
      trafficHistory,
      topKeywords,
    };

    const res = NextResponse.json({ data });

    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Domain overview API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
