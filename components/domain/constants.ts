/**
 * Shared constants for the Domain Overview flagship: the endpoint slugs it runs,
 * default geo targeting, and per-list row caps. Kept in one place so the prices
 * hook, the report hook, and the extractors all agree on what gets called.
 */

/** United States / English — the same defaults the endpoint explorer seeds. */
export const DEFAULT_LOCATION_CODE = 2840;
export const DEFAULT_LANGUAGE_CODE = "en";

/** Rows per list endpoint. Small enough that one payment returns quickly. */
export const KEYWORDS_LIMIT = 100;
export const COMPETITORS_LIMIT = 50;

/**
 * The five DataForSEO endpoints a full domain report runs. Verified against
 * `lib/registry` — every slug resolves and each is a billable `live` POST.
 */
export const DOMAIN_SLUGS = {
  rankOverview: "dataforseo_labs/google/domain_rank_overview/live",
  backlinksSummary: "backlinks/summary/live",
  rankedKeywords: "dataforseo_labs/google/ranked_keywords/live",
  competitors: "dataforseo_labs/google/competitors_domain/live",
  technologies: "domain_analytics/technologies/domain_technologies/live",
} as const;

/** Flat list of every slug the report touches, for the price manifest lookup. */
export const ALL_DOMAIN_SLUGS = Object.values(DOMAIN_SLUGS);
