import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { getGoogleTrendsData } from "@/lib/mock-data";
import type {
  DataForSEOResponse,
  GoogleTrendsExploreResult,
} from "@/lib/dataforseo-types";

interface TrendDataPoint {
  date: string;
  values: Record<string, number>;
}

interface TrendsApiResponse {
  trendLine: TrendDataPoint[];
  interestByRegion: { region: string; value: number }[];
  risingQueries: { query: string; value: number }[];
  topQueries: { query: string; value: number }[];
}

// Location code mapping for Google Trends
const locationCodeMap: Record<string, number> = {
  US: 2840,
  UK: 2826,
  CA: 2124,
  DE: 2276,
  FR: 2250,
  AU: 2036,
  JP: 2392,
  BR: 2076,
};

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const {
      keywords,
      geo = "US",
      timeRange = "5y",
    } = await request.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "keywords array is required" },
        { status: 400 }
      );
    }

    if (keywords.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 keywords allowed" },
        { status: 400 }
      );
    }

    // Validate keywords
    for (const kw of keywords) {
      if (typeof kw !== "string" || kw.trim().length === 0) {
        return NextResponse.json(
          { error: "Each keyword must be a non-empty string" },
          { status: 400 }
        );
      }
      if (kw.length > 100) {
        return NextResponse.json(
          { error: "Keywords must be 100 characters or less" },
          { status: 400 }
        );
      }
    }

    // Use mock data if no credentials
    if (!hasCredentials()) {
      const mock = getGoogleTrendsData(keywords);
      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
    }

    // Calculate date range based on timeRange
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "2y":
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case "5y":
      default:
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
    }

    const locationCode = locationCodeMap[geo] || 2840;

    const trendsRes = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live",
      [
        {
          keywords,
          location_code: locationCode,
          language_code: "en",
          date_from: startDate.toISOString().split("T")[0],
          date_to: endDate.toISOString().split("T")[0],
          type: "web",
        },
      ],
      24 // 24 hour cache TTL
    );

    const trendsTask = (
      trendsRes as unknown as DataForSEOResponse<GoogleTrendsExploreResult>
    ).tasks?.[0];

    if (trendsTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: trendsTask?.status_message || "Trends fetch failed" },
        { status: 502 }
      );
    }

    const trendsItem = trendsTask.result?.[0]?.items?.[0];
    if (!trendsItem) {
      // No data found - return empty but valid response
      const emptyResponse: TrendsApiResponse = {
        trendLine: [],
        interestByRegion: [],
        risingQueries: [],
        topQueries: [],
      };
      return NextResponse.json({ data: emptyResponse });
    }

    // Transform trend line data
    const trendLine: TrendDataPoint[] = (trendsItem.data || []).map((dp) => {
      const date = dp.date_from.slice(0, 7); // YYYY-MM format
      const values: Record<string, number> = {};

      keywords.forEach((kw, idx) => {
        values[kw] = dp.values?.[idx] ?? 0;
      });

      return { date, values };
    });

    // Transform interest by region (top 5)
    const interestByRegion = (trendsItem.data_by_region || [])
      .slice(0, 5)
      .map((region) => ({
        region: region.geo_name,
        value: region.values?.[0] ?? 0,
      }));

    // Transform queries
    const risingQueries = (trendsItem.rising_queries || []).slice(0, 5).map((q) => ({
      query: q.query,
      value: q.value,
    }));

    const topQueries = (trendsItem.top_queries || []).slice(0, 5).map((q) => ({
      query: q.query,
      value: q.value,
    }));

    const response: TrendsApiResponse = {
      trendLine,
      interestByRegion,
      risingQueries,
      topQueries,
    };

    return NextResponse.json({ data: response });
  } catch (err: unknown) {
    console.error("Google Trends API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
