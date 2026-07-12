/**
 * Pluck the parts we render out of a DataForSEO envelope. The result we want is
 * always at `tasks[0].result[0]`; list endpoints carry their rows in `.items`.
 */

import type {
  BacklinkSummary,
  Backlink,
  ReferringDomain,
  DataForSEOEnvelope,
} from "./backlinks-types";

export function extractSummary(env: DataForSEOEnvelope<BacklinkSummary>): BacklinkSummary | null {
  return env.tasks?.[0]?.result?.[0] ?? null;
}

export function extractReferringDomains(env: DataForSEOEnvelope<unknown>): ReferringDomain[] {
  return (env.tasks?.[0]?.result?.[0]?.items as ReferringDomain[] | undefined) ?? [];
}

export function extractBacklinks(env: DataForSEOEnvelope<unknown>): Backlink[] {
  return (env.tasks?.[0]?.result?.[0]?.items as Backlink[] | undefined) ?? [];
}
