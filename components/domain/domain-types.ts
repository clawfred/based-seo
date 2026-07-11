/**
 * Shapes for the slice of each DataForSEO result the Domain Overview renders.
 *
 * As with the backlinks types, every field is optional: DataForSEO omits keys it
 * has no data for and we only read a curated subset, so the UI must tolerate
 * partial rows rather than assume a fixed shape.
 */

/** Minimal view of the DataForSEO envelope we index into (`tasks[0].result[0]`). */
export interface DomainEnvelope<T> {
  tasks?: Array<{
    result?: Array<T> | null;
  } | null> | null;
}

/** A DataForSEO Labs `metrics.organic` block (also nested under items[0]). */
export interface OrganicMetrics {
  count?: number;
  etv?: number;
  impressions_etv?: number;
  estimated_paid_traffic_cost?: number;
  is_up?: number;
  is_down?: number;
}

/** `domain_rank_overview/live` — result[0]. Traffic/keyword footprint. */
export interface RankOverviewResult {
  target?: string;
  metrics?: { organic?: OrganicMetrics; paid?: OrganicMetrics };
  items?: Array<{ metrics?: { organic?: OrganicMetrics; paid?: OrganicMetrics } }>;
}

/** `backlinks/summary/live` — result[0]. Only the fields the overview shows. */
export interface BacklinkSummaryResult {
  target?: string;
  rank?: number;
  backlinks?: number;
  referring_domains?: number;
  referring_main_domains?: number;
}

/** `ranked_keywords/live` — one entry in result[0].items. */
export interface RankedKeywordItem {
  keyword_data?: {
    keyword?: string;
    keyword_info?: { search_volume?: number; cpc?: number; competition_level?: string };
  };
  ranked_serp_element?: {
    serp_item?: { rank_absolute?: number; rank_group?: number; etv?: number; url?: string };
  };
}

/** `competitors_domain/live` — one entry in result[0].items. */
export interface CompetitorItem {
  domain?: string;
  avg_position?: number;
  intersections?: number;
  full_domain_metrics?: { organic?: OrganicMetrics };
  metrics?: { organic?: OrganicMetrics };
}

/** Combined headline stats for the Overview tab, drawn from two endpoints. */
export interface OverviewStats {
  organicKeywords?: number;
  organicTraffic?: number;
  trafficValue?: number;
  referringDomains?: number;
  backlinks?: number;
  domainRank?: number;
}

/** A single row in the Top Keywords table. */
export interface KeywordRow {
  keyword?: string;
  position?: number;
  volume?: number;
  cpc?: number;
  traffic?: number;
  url?: string;
}

/** A single row in the Competitors table. */
export interface CompetitorRow {
  domain?: string;
  avgPosition?: number;
  commonKeywords?: number;
  organicKeywords?: number;
  organicTraffic?: number;
}

/** Technologies collapsed into one bucket per category, e.g. "CMS" -> [...]. */
export interface TechCategory {
  category: string;
  items: string[];
}

/** The fully-assembled report the tabs render. */
export interface DomainReport {
  target: string;
  overview: OverviewStats | null;
  keywords: KeywordRow[];
  competitors: CompetitorRow[];
  technologies: TechCategory[];
}
