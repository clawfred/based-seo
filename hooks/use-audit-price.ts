"use client";

import { useManifestPrices } from "@/hooks/use-manifest-prices";

/** The billable endpoint that starts a crawl; priced per page crawled. */
const TASK_POST_SLUG = "on_page/task_post";

/** Fallback per-page price if the manifest can't be read (~$0.000125/page). */
const FALLBACK_PER_PAGE_USD = 0.000125;

export interface AuditPrice {
  /** USD charged per crawled page. */
  perPageUsd: number;
  /** Estimate for a crawl of `pages` pages. */
  estimateFor: (pages: number) => number;
  loading: boolean;
}

/**
 * Reads the live per-page crawl price from the manifest so the UI can show a
 * cost estimate before the user starts a billable crawl.
 */
export function useAuditPrice(): AuditPrice {
  const { priceOf, loading } = useManifestPrices();
  const perPageUsd = priceOf(TASK_POST_SLUG)?.usd ?? FALLBACK_PER_PAGE_USD;

  return {
    perPageUsd,
    estimateFor: (pages: number) => perPageUsd * Math.max(0, pages),
    loading,
  };
}
