/**
 * Pure derivations from the raw OnPage summary into the shapes the UI renders.
 * Every access is guarded — OnPage payloads routinely omit whole branches.
 */

import { CHECK_CATALOG, SEVERITY_RANK, type CheckDef } from "./checks-catalog";
import type { AuditSummary, ChecksMap } from "./audit-types";

export interface DerivedIssue extends CheckDef {
  /** Number of crawled pages that tripped this check. */
  count: number;
}

export interface CrawlProgressInfo {
  pagesCrawled: number;
  maxPages: number;
  inQueue: number;
  /** 0–100, clamped; falls back to indeterminate handling in the UI when 0. */
  percent: number;
}

/** Read a check value (count or boolean) as a non-negative number. */
function countOf(checks: ChecksMap | undefined, key: string): number {
  const v = checks?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === true) return 1;
  return 0;
}

/**
 * Every cataloged check with a positive count on the summary, sorted by severity
 * then by how many pages are affected. Checks the API didn't report are skipped.
 */
export function extractIssues(summary: AuditSummary | null): DerivedIssue[] {
  const checks = summary?.page_metrics?.checks;
  if (!checks) return [];

  const issues: DerivedIssue[] = [];
  for (const def of CHECK_CATALOG) {
    const count = countOf(checks, def.key);
    if (count > 0) issues.push({ ...def, count });
  }

  return issues.sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    return bySeverity !== 0 ? bySeverity : b.count - a.count;
  });
}

/** Total number of failing pages across all cataloged issues, by severity. */
export function countBySeverity(issues: DerivedIssue[]) {
  return issues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, notice: 0 },
  );
}

/** Crawl progress for the polling panel. Missing counts degrade to zeros. */
export function extractProgress(summary: AuditSummary | null): CrawlProgressInfo {
  const status = summary?.crawl_status;
  const pagesCrawled = numberOr(status?.pages_crawled, 0);
  const maxPages = numberOr(status?.max_crawl_pages, 0);
  const inQueue = numberOr(status?.pages_in_queue, 0);

  const denominator = maxPages > 0 ? maxPages : pagesCrawled + inQueue;
  const percent =
    denominator > 0 ? Math.min(100, Math.round((pagesCrawled / denominator) * 100)) : 0;

  return { pagesCrawled, maxPages, inQueue, percent };
}

function numberOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
