/**
 * Navigation taxonomy for the dashboard, derived from the registry.
 *
 * With 351 public endpoints, the sidebar cannot be hand-maintained. Families map
 * to DataForSEO's API groups; each carries an icon name (resolved to a Lucide
 * icon in the UI, kept as a string here so this module stays server-safe) and
 * the endpoints that belong to it.
 */

import { listPublic } from "./index";
import type { EndpointDef } from "./types";

export interface Family {
  readonly id: string;
  readonly label: string;
  /** Lucide icon name. */
  readonly icon: string;
  /** One-line pitch for the family landing card. */
  readonly blurb: string;
  readonly group: string;
}

/**
 * Ordered so the families a human reaches for first (keywords, backlinks, site
 * audit, GEO) lead, and the long-tail data families follow.
 */
export const FAMILIES: readonly Family[] = [
  {
    id: "labs",
    label: "Keyword Research",
    icon: "Search",
    blurb: "Volume, difficulty, CPC, ideas, and SERP competitors for any keyword.",
    group: "DataForSEO Labs API",
  },
  {
    id: "backlinks",
    label: "Backlinks",
    icon: "Link2",
    blurb: "Referring domains, anchors, and the full link profile of any target.",
    group: "Backlinks API",
  },
  {
    id: "onpage",
    label: "Site Audit",
    icon: "Gauge",
    blurb: "Crawl a site for technical issues, Core Web Vitals, and on-page problems.",
    group: "OnPage API",
  },
  {
    id: "serp",
    label: "SERP",
    icon: "ListOrdered",
    blurb: "Live search results across Google, Bing, YouTube, Maps, and more.",
    group: "SERP API",
  },
  {
    id: "ai",
    label: "AI Visibility (GEO)",
    icon: "Sparkles",
    blurb: "How ChatGPT, Claude, Gemini, and Perplexity cite your brand.",
    group: "AI Optimization API",
  },
  {
    id: "keywords_data",
    label: "Keywords Data",
    icon: "BarChart3",
    blurb: "Search volume, trends, and ad traffic straight from Google Ads and Bing.",
    group: "Keywords Data API",
  },
  {
    id: "domain",
    label: "Domain Analytics",
    icon: "Globe",
    blurb: "Technology stacks and Whois data for any domain.",
    group: "Domain Analytics API",
  },
  {
    id: "content",
    label: "Content Analysis",
    icon: "FileText",
    blurb: "Brand mentions, sentiment, and citation data across the web.",
    group: "Content Analysis API",
  },
  {
    id: "merchant",
    label: "Merchant",
    icon: "ShoppingCart",
    blurb: "Google Shopping and Amazon product, seller, and pricing data.",
    group: "Merchant API",
  },
  {
    id: "business",
    label: "Business Data",
    icon: "Store",
    blurb: "Google Business, reviews, and listings from Trustpilot and Tripadvisor.",
    group: "Business Data API",
  },
  {
    id: "app",
    label: "App Data",
    icon: "Smartphone",
    blurb: "App Store and Google Play rankings, listings, and reviews.",
    group: "App Data API",
  },
  {
    id: "content_gen",
    label: "Content Tools",
    icon: "PenLine",
    blurb: "Text summarization and language utilities.",
    group: "Content Generation API",
  },
] as const;

const BY_GROUP = new Map(FAMILIES.map((f) => [f.group, f]));
const BY_ID = new Map(FAMILIES.map((f) => [f.id, f]));

export function getFamily(id: string): Family | undefined {
  return BY_ID.get(id);
}

export function familyForGroup(group: string): Family | undefined {
  return BY_GROUP.get(group);
}

/** Public, billable-or-free endpoints in a family, minus internal task retrieval. */
export function endpointsInFamily(family: Family): EndpointDef[] {
  return listPublic()
    .filter((e) => e.group === family.group)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export interface FamilyStat {
  readonly family: Family;
  readonly count: number;
  readonly fromUsd: number;
}

/** Families with a live endpoint count and cheapest price, for the overview grid. */
export function familyStats(): FamilyStat[] {
  return FAMILIES.map((family) => {
    const endpoints = endpointsInFamily(family);
    const billable = endpoints.filter((e) => e.billable);
    const fromUsd = billable.length ? Math.min(...billable.map((e) => e.dfsCostUsd)) : 0;
    return { family, count: endpoints.length, fromUsd };
  }).filter((s) => s.count > 0);
}
