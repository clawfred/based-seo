import { NextRequest, NextResponse } from "next/server";

import { checkRateLimit } from "@/lib/api-middleware";
import { cachedDataforseoFetch } from "@/lib/dataforseo-cached";
import { hasCredentials } from "@/lib/dataforseo-server";
import { requireX402Payment } from "@/lib/x402-guard";
import type { DataForSEOResponse, BacklinksSummaryResult } from "@/lib/dataforseo-types";

export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const pay = await requireX402Payment(request);
  if (!pay.ok) return pay.response;

  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    // Basic domain validation
    const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    if (cleanDomain.length > 253 || !/^[a-z0-9]+([\-.][a-z0-9]+)*\.[a-z]{2,}$/.test(cleanDomain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
    }

    if (!hasCredentials()) {
      // Return mock data when no credentials configured
      const mockData = {
        domain: cleanDomain,
        totalBacklinks: 15432,
        referringDomains: 892,
        domainRank: 45,
        dofollowRatio: 0.68,
        newLinks30d: 234,
        lostLinks30d: 56,
        topAnchors: [
          { anchor: cleanDomain, backlinks: 3245, percentage: 21 },
          { anchor: "click here", backlinks: 1523, percentage: 9.9 },
          { anchor: "learn more", backlinks: 892, percentage: 5.8 },
          { anchor: "official site", backlinks: 654, percentage: 4.2 },
          { anchor: "best tools", backlinks: 432, percentage: 2.8 },
        ],
        referringDomainsBreakdown: {
          blogs: 342,
          news: 128,
          ecommerce: 89,
          forums: 156,
          social: 67,
          other: 110,
        },
      };

      return NextResponse.json({
        warning: "Using mock data — DataForSEO credentials not configured",
        data: mockData,
      });
    }

    const summaryRes = await cachedDataforseoFetch(
      "https://api.dataforseo.com/v3/backlinks/summary/live",
      [
        {
          target: cleanDomain,
          internal_list_limit: 10,
          include_subdomains: true,
        },
      ],
    );

    const summaryTask = (summaryRes as unknown as DataForSEOResponse<BacklinksSummaryResult>)
      .tasks?.[0];

    if (summaryTask?.status_code !== 20000) {
      return NextResponse.json(
        { error: summaryTask?.status_message || "Backlinks summary fetch failed" },
        { status: 502 },
      );
    }

    const summaryItem = summaryTask.result?.[0];
    if (!summaryItem) {
      return NextResponse.json({ error: "No backlinks data found" }, { status: 404 });
    }

    // Calculate dofollow ratio
    const totalFollowable = summaryItem.dofollow + summaryItem.nofollow;
    const dofollowRatio = totalFollowable > 0 ? summaryItem.dofollow / totalFollowable : 0;

    // Get anchor data from anchors endpoint for top anchors
    let topAnchors: { anchor: string; backlinks: number; percentage: number }[] = [];
    
    try {
      const anchorsRes = await cachedDataforseoFetch(
        "https://api.dataforseo.com/v3/backlinks/anchors/live",
        [
          {
            target: cleanDomain,
            include_subdomains: true,
            limit: 10,
            order_by: ["backlinks,desc"],
          },
        ],
      );

      interface AnchorsResult {
        items?: Array<{
          anchor: string;
          backlinks: number;
        }>;
        total_count?: number;
      }

      const anchorsTask = (anchorsRes as unknown as DataForSEOResponse<AnchorsResult>).tasks?.[0];
      if (anchorsTask?.status_code === 20000 && anchorsTask.result?.[0]?.items) {
        const totalBacklinks = summaryItem.total_backlinks || 1;
        topAnchors = anchorsTask.result[0].items.slice(0, 5).map((item) => ({
          anchor: item.anchor || "(no anchor)",
          backlinks: item.backlinks || 0,
          percentage: Number(((item.backlinks / totalBacklinks) * 100).toFixed(1)),
        }));
      }
    } catch {
      // Anchors fetch failed, continue without them
    }

    // Build referring domains breakdown from platform types
    const platformTypes = summaryItem.referring_links_platform_types || {};
    const referringDomainsBreakdown: Record<string, number> = {};
    for (const [key, value] of Object.entries(platformTypes)) {
      // Map platform types to readable names
      const keyMap: Record<string, string> = {
        blogs: "Blogs",
        news: "News",
        ecommerce: "E-commerce",
        forums: "Forums",
        social: "Social",
        message_boards: "Forums",
        wiki: "Wiki",
        unknown: "Other",
      };
      const mappedKey = keyMap[key.toLowerCase()] || key;
      referringDomainsBreakdown[mappedKey] = (referringDomainsBreakdown[mappedKey] || 0) + value;
    }

    const data = {
      domain: summaryItem.target,
      totalBacklinks: summaryItem.total_backlinks || 0,
      referringDomains: summaryItem.referring_domains || 0,
      domainRank: summaryItem.rank || 0,
      dofollowRatio: Number(dofollowRatio.toFixed(2)),
      newLinks30d: summaryItem.new_backlinks || 0,
      lostLinks30d: summaryItem.lost_backlinks || 0,
      topAnchors,
      referringDomainsBreakdown,
    };

    const res = NextResponse.json({ data });

    for (const [k, v] of Object.entries(pay.settleHeaders)) {
      res.headers.set(k, v);
    }

    return res;
  } catch (err: unknown) {
    console.error("Backlinks summary API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
