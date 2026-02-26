import { NextRequest, NextResponse } from "next/server";
import { hasCredentials } from "@/lib/dataforseo-server";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { checkRateLimit } from "@/lib/api-middleware";
import { requireX402Payment } from "@/lib/x402-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Supported platforms
const SUPPORTED_PLATFORMS = ["google_ai_overview", "chatgpt", "claude", "perplexity"] as const;
type Platform = (typeof SUPPORTED_PLATFORMS)[number];

// Platform display info
const PLATFORM_INFO: Record<Platform, { name: string; available: boolean }> = {
  google_ai_overview: { name: "Google AI Overview", available: true },
  chatgpt: { name: "ChatGPT", available: false },
  claude: { name: "Claude", available: false },
  perplexity: { name: "Perplexity", available: false },
};

interface GeoSearchRequest {
  query: string;
  brand: string;
  platforms?: Platform[];
  location_code?: number;
  language_code?: string;
}

interface Source {
  url: string;
  title: string;
  domain: string;
}

interface PlatformResult {
  platform: Platform;
  platformName: string;
  available: boolean;
  aiResponse: string | null;
  brandMentioned: boolean;
  mentionContext: string | null;
  sources: Source[];
  error?: string;
}

interface GeoSearchResponse {
  query: string;
  brand: string;
  results: PlatformResult[];
  summary: {
    totalPlatforms: number;
    availablePlatforms: number;
    mentionedIn: number;
  };
}

// Mock data for when DataForSEO credentials are not configured
function getMockGeoResult(query: string, brand: string): GeoSearchResponse {
  const brandLower = brand.toLowerCase();
  const mockAiResponse = `Based on our analysis, here are the top recommendations for ${query}. Several tools stand out including Ahrefs, SEMrush, and Moz. ${brandLower.includes("ahrefs") || brandLower.includes("semrush") ? `${brand} is particularly notable for its comprehensive features.` : ""} These platforms offer keyword research, backlink analysis, and rank tracking capabilities.`;

  const brandMentioned = mockAiResponse.toLowerCase().includes(brandLower);

  return {
    query,
    brand,
    results: [
      {
        platform: "google_ai_overview",
        platformName: "Google AI Overview",
        available: true,
        aiResponse: mockAiResponse,
        brandMentioned,
        mentionContext: brandMentioned
          ? `${brand} is particularly notable for its comprehensive features.`
          : null,
        sources: [
          { url: "https://ahrefs.com/blog/seo-tools", title: "Best SEO Tools 2024", domain: "ahrefs.com" },
          { url: "https://backlinko.com/seo-tools", title: "Top SEO Software", domain: "backlinko.com" },
          { url: "https://moz.com/tools", title: "SEO Tools by Moz", domain: "moz.com" },
        ],
      },
      {
        platform: "chatgpt",
        platformName: "ChatGPT",
        available: false,
        aiResponse: null,
        brandMentioned: false,
        mentionContext: null,
        sources: [],
      },
      {
        platform: "claude",
        platformName: "Claude",
        available: false,
        aiResponse: null,
        brandMentioned: false,
        mentionContext: null,
        sources: [],
      },
      {
        platform: "perplexity",
        platformName: "Perplexity",
        available: false,
        aiResponse: null,
        brandMentioned: false,
        mentionContext: null,
        sources: [],
      },
    ],
    summary: {
      totalPlatforms: 4,
      availablePlatforms: 1,
      mentionedIn: brandMentioned ? 1 : 0,
    },
  };
}

// Extract AI Overview content from DataForSEO SERP response
function extractAiOverview(serpResult: any): { text: string; sources: Source[] } | null {
  const items = serpResult?.items || [];

  // Look for ai_overview type items
  for (const item of items) {
    if (item.type === "ai_overview") {
      const text = item.text || item.description || item.snippet || "";
      const sources: Source[] = [];

      // Extract sources from the AI overview item
      if (item.items && Array.isArray(item.items)) {
        for (const source of item.items) {
          if (source.url) {
            sources.push({
              url: source.url,
              title: source.title || source.url,
              domain: source.domain || new URL(source.url).hostname,
            });
          }
        }
      }

      // Also check for references/citations
      if (item.references && Array.isArray(item.references)) {
        for (const ref of item.references) {
          if (ref.url && !sources.some(s => s.url === ref.url)) {
            sources.push({
              url: ref.url,
              title: ref.title || ref.url,
              domain: ref.domain || new URL(ref.url).hostname,
            });
          }
        }
      }

      return { text, sources };
    }
  }

  // Fallback: check for featured_snippet which sometimes contains AI-like summaries
  for (const item of items) {
    if (item.type === "featured_snippet" || item.type === "knowledge_graph") {
      const text = item.description || item.text || item.snippet || "";
      if (text) {
        return {
          text,
          sources: item.url ? [{
            url: item.url,
            title: item.title || item.url,
            domain: item.domain || new URL(item.url).hostname,
          }] : [],
        };
      }
    }
  }

  return null;
}

// Check if brand is mentioned in text and extract context
function findBrandMention(text: string, brand: string): { mentioned: boolean; context: string | null } {
  const brandLower = brand.toLowerCase();
  const textLower = text.toLowerCase();

  if (!textLower.includes(brandLower)) {
    return { mentioned: false, context: null };
  }

  // Find the sentence containing the brand mention
  const sentences = text.split(/[.!?]+/);
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(brandLower)) {
      return { mentioned: true, context: sentence.trim() };
    }
  }

  return { mentioned: true, context: null };
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const body: GeoSearchRequest = await request.json();
    const { query, brand, location_code = 2840, language_code = "en" } = body;

    // Validate required fields
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    if (!brand || typeof brand !== "string") {
      return NextResponse.json({ error: "brand is required" }, { status: 400 });
    }

    if (query.trim().length > 500) {
      return NextResponse.json({ error: "query is too long (max 500 chars)" }, { status: 400 });
    }

    if (brand.trim().length > 100) {
      return NextResponse.json({ error: "brand is too long (max 100 chars)" }, { status: 400 });
    }

    // Determine which platforms to check
    const platformsToCheck: Platform[] = body.platforms?.length
      ? body.platforms.filter((p): p is Platform => SUPPORTED_PLATFORMS.includes(p as Platform))
      : [...SUPPORTED_PLATFORMS];

    // Check if we have DataForSEO credentials
    if (!hasCredentials()) {
      const mock = getMockGeoResult(query.trim(), brand.trim());
      const res = NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mock,
      });
      for (const [k, v] of Object.entries(pay.settleHeaders)) {
        res.headers.set(k, v);
      }
      return res;
    }

    // Fetch Google AI Overview via SERP API (advanced endpoint for AI overviews)
    const results: PlatformResult[] = [];

    for (const platform of platformsToCheck) {
      const info = PLATFORM_INFO[platform];

      if (!info.available) {
        // Platform not yet available
        results.push({
          platform,
          platformName: info.name,
          available: false,
          aiResponse: null,
          brandMentioned: false,
          mentionContext: null,
          sources: [],
        });
        continue;
      }

      if (platform === "google_ai_overview") {
        try {
          // Use advanced endpoint to get AI overviews
          const res: any = await cachedDataforseoFetch(
            "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
            [{
              keyword: query.trim(),
              location_code,
              language_code,
              device: "desktop",
              os: "windows",
            }],
          );

          const task = res.tasks?.[0];
          if (!task || task.status_code !== 20000 || !task.result?.[0]) {
            results.push({
              platform,
              platformName: info.name,
              available: true,
              aiResponse: null,
              brandMentioned: false,
              mentionContext: null,
              sources: [],
              error: task?.status_message || "No results returned from Google",
            });
            continue;
          }

          const aiOverview = extractAiOverview(task.result[0]);

          if (!aiOverview || !aiOverview.text) {
            results.push({
              platform,
              platformName: info.name,
              available: true,
              aiResponse: null,
              brandMentioned: false,
              mentionContext: null,
              sources: [],
              error: "No AI Overview found for this query",
            });
            continue;
          }

          const brandCheck = findBrandMention(aiOverview.text, brand.trim());

          results.push({
            platform,
            platformName: info.name,
            available: true,
            aiResponse: aiOverview.text,
            brandMentioned: brandCheck.mentioned,
            mentionContext: brandCheck.context,
            sources: aiOverview.sources,
          });
        } catch (err) {
          console.error("Google AI Overview fetch error:", err);
          results.push({
            platform,
            platformName: info.name,
            available: true,
            aiResponse: null,
            brandMentioned: false,
            mentionContext: null,
            sources: [],
            error: "Failed to fetch AI Overview",
          });
        }
      }
    }

    // Calculate summary
    const availablePlatforms = results.filter(r => r.available).length;
    const mentionedIn = results.filter(r => r.available && r.brandMentioned).length;

    const responseData: GeoSearchResponse = {
      query: query.trim(),
      brand: brand.trim(),
      results,
      summary: {
        totalPlatforms: results.length,
        availablePlatforms,
        mentionedIn,
      },
    };

    const response = NextResponse.json({ data: responseData });
    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      response.headers.set(k, v);
    }
    return response;
  } catch (err: unknown) {
    console.error("GEO Search API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
