"use client";

import { useCallback, useState } from "react";
import type { WalletClient } from "viem";

import { paidPost, type PaidPostResult } from "@/hooks/paid-post";
import { BRAND_SLUGS } from "@/components/geo/brand/brand-slugs";
import { resultOf, itemsOf, type Row } from "@/components/geo/geo-extract";

/** Rows for the competitor leaderboard. Small so a single payment returns fast. */
const BRAND_LIMIT = 20;

export type BrandStatus = "idle" | "loading" | "paywall" | "error" | "success";

export interface BrandData {
  target: string;
  keyword: string;
  /** target_metrics result[0]. */
  metrics: Row | null;
  /** top_mentioned_brands items (empty when no keyword was given). */
  brands: Row[];
  /** timeseries_new_lost items. */
  timeseries: Row[];
}

export interface BrandVisibilityQuery {
  status: BrandStatus;
  data: BrandData | null;
  error: string | null;
  run: (target: string, keyword: string, walletClient?: WalletClient) => Promise<void>;
  reset: () => void;
}

/**
 * Orchestrates the paid LLM-mentions calls for one brand. Owns fetch state only
 * — the inputs live in the search component. The competitor leaderboard is
 * keyword-scoped, so it only runs when a topic keyword is supplied. A missing
 * wallet turns the whole run into a paywall; a total failure into an error;
 * anything that returns data renders as success.
 */
export function useBrandVisibility(): BrandVisibilityQuery {
  const [status, setStatus] = useState<BrandStatus>("idle");
  const [data, setData] = useState<BrandData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  const run = useCallback(
    async (rawTarget: string, rawKeyword: string, walletClient?: WalletClient) => {
      const target = rawTarget.trim();
      const keyword = rawKeyword.trim();
      if (!target) return;

      setStatus("loading");
      setError(null);

      const calls: Promise<PaidPostResult<unknown>>[] = [
        paidPost<unknown>(BRAND_SLUGS.targetMetrics, { target }, walletClient),
        paidPost<unknown>(BRAND_SLUGS.timeseries, { target }, walletClient),
      ];
      if (keyword) {
        calls.push(
          paidPost<unknown>(BRAND_SLUGS.topBrands, { keyword, limit: BRAND_LIMIT }, walletClient),
        );
      }

      const [metricsRes, timeseriesRes, brandsRes] = await Promise.all(calls);
      const results = [metricsRes, timeseriesRes, brandsRes].filter(
        Boolean,
      ) as PaidPostResult<unknown>[];

      // No wallet (or every call bounced): the user must pay first.
      if (results.every((r) => r.status === "payment_required")) {
        setStatus("paywall");
        return;
      }

      // Nothing came back with data: surface the first real error.
      if (!results.some((r) => r.status === "ok")) {
        setStatus("error");
        setError(firstErrorMessage(results));
        return;
      }

      setData({
        target,
        keyword,
        metrics: metricsRes.status === "ok" ? resultOf(metricsRes.envelope) : null,
        timeseries: timeseriesRes.status === "ok" ? itemsOf(timeseriesRes.envelope) : [],
        brands: brandsRes && brandsRes.status === "ok" ? itemsOf(brandsRes.envelope) : [],
      });
      setStatus("success");
    },
    [],
  );

  return { status, data, error, run, reset };
}

function firstErrorMessage(results: PaidPostResult<unknown>[]): string {
  const err = results.find((r) => r.status === "error");
  return err && err.status === "error" ? err.message : "The request failed.";
}
