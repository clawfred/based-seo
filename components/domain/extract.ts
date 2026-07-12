/**
 * Pluck the parts we render out of each DataForSEO envelope. Results always sit
 * at `tasks[0].result[0]`; list endpoints carry their rows in `.items`.
 *
 * Every runner hands us `unknown` (the envelope), so each extractor narrows
 * defensively and tolerates missing branches rather than assuming a shape.
 */

import type {
  DomainEnvelope,
  RankOverviewResult,
  BacklinkSummaryResult,
  RankedKeywordItem,
  CompetitorItem,
  OverviewStats,
  KeywordRow,
  CompetitorRow,
  TechCategory,
} from "./domain-types";

function firstResult<T>(env: unknown): T | null {
  return (env as DomainEnvelope<T>)?.tasks?.[0]?.result?.[0] ?? null;
}

function items<T>(env: unknown): T[] {
  const result = firstResult<{ items?: T[] }>(env);
  return result?.items ?? [];
}

/**
 * Merge the two Overview endpoints into one stat block. Either may be null when
 * that call failed or wasn't paid for; the card just shows a dash.
 */
export function extractOverview(rankEnv: unknown, summaryEnv: unknown): OverviewStats | null {
  const rank = firstResult<RankOverviewResult>(rankEnv);
  const summary = firstResult<BacklinkSummaryResult>(summaryEnv);
  if (!rank && !summary) return null;

  // domain_rank_overview nests organic metrics either directly or under items[0].
  const organic = rank?.metrics?.organic ?? rank?.items?.[0]?.metrics?.organic;

  return {
    organicKeywords: organic?.count,
    organicTraffic: organic?.etv,
    trafficValue: organic?.estimated_paid_traffic_cost,
    referringDomains: summary?.referring_domains,
    backlinks: summary?.backlinks,
    domainRank: summary?.rank,
  };
}

export function extractKeywords(env: unknown): KeywordRow[] {
  return items<RankedKeywordItem>(env).map((item) => {
    const info = item.keyword_data?.keyword_info;
    const serp = item.ranked_serp_element?.serp_item;
    return {
      keyword: item.keyword_data?.keyword,
      position: serp?.rank_absolute ?? serp?.rank_group,
      volume: info?.search_volume,
      cpc: info?.cpc,
      traffic: serp?.etv,
      url: serp?.url,
    };
  });
}

export function extractCompetitors(env: unknown): CompetitorRow[] {
  return items<CompetitorItem>(env).map((item) => {
    const organic = item.full_domain_metrics?.organic ?? item.metrics?.organic;
    return {
      domain: item.domain,
      avgPosition: item.avg_position,
      commonKeywords: item.intersections,
      organicKeywords: organic?.count,
      organicTraffic: organic?.etv,
    };
  });
}

/**
 * `domain_technologies` returns `technologies` as group -> category -> string[].
 * We flatten it to one bucket per category, merging duplicate categories that
 * appear under different groups, and drop empties.
 */
export function extractTechnologies(env: unknown): TechCategory[] {
  const result = firstResult<{ technologies?: Record<string, Record<string, string[]>> }>(env);
  const groups = result?.technologies;
  if (!groups) return [];

  const byCategory = new Map<string, Set<string>>();
  for (const categories of Object.values(groups)) {
    if (!categories) continue;
    for (const [category, techs] of Object.entries(categories)) {
      if (!Array.isArray(techs) || techs.length === 0) continue;
      const bucket = byCategory.get(category) ?? new Set<string>();
      techs.forEach((t) => bucket.add(t));
      byCategory.set(category, bucket);
    }
  }

  return [...byCategory.entries()]
    .map(([category, set]) => ({ category, items: [...set] }))
    .sort((a, b) => b.items.length - a.items.length);
}
