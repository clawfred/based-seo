"use client";

import { useCallback, useState } from "react";
import type { WalletClient } from "viem";
import { paidPost, type PaidPostResult } from "@/hooks/paid-post";
import { BACKLINK_SLUGS } from "@/hooks/use-backlink-prices";
import {
  extractSummary,
  extractReferringDomains,
  extractBacklinks,
} from "@/components/backlinks/extract";
import type {
  BacklinkSummary,
  Backlink,
  ReferringDomain,
  DataForSEOEnvelope,
} from "@/components/backlinks/backlinks-types";

/** Rows per list endpoint. Kept small so a single payment returns fast. */
const LIST_LIMIT = 100;

export type QueryStatus = "idle" | "loading" | "paywall" | "error" | "success";

export interface BacklinksData {
  target: string;
  summary: BacklinkSummary | null;
  referringDomains: ReferringDomain[];
  backlinks: Backlink[];
}

export interface BacklinksQuery {
  status: QueryStatus;
  data: BacklinksData | null;
  error: string | null;
  run: (target: string, walletClient?: WalletClient) => Promise<void>;
  reset: () => void;
}

/**
 * Orchestrates the three paid backlink calls for one target. Owns fetch state
 * only — the target input string lives in the search component. A missing
 * wallet turns the whole run into a paywall; a rejected/failed call turns it
 * into an error; anything that returns data renders as success.
 */
export function useBacklinksQuery(): BacklinksQuery {
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [data, setData] = useState<BacklinksData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  const run = useCallback(async (rawTarget: string, walletClient?: WalletClient) => {
    const target = rawTarget.trim();
    if (!target) return;

    setStatus("loading");
    setError(null);

    const body = { target };
    const listBody = { ...body, limit: LIST_LIMIT };

    const [summaryRes, domainsRes, backlinksRes] = await Promise.all([
      paidPost<DataForSEOEnvelope<BacklinkSummary>>(BACKLINK_SLUGS[0], body, walletClient),
      paidPost<DataForSEOEnvelope<unknown>>(BACKLINK_SLUGS[1], listBody, walletClient),
      paidPost<DataForSEOEnvelope<unknown>>(BACKLINK_SLUGS[2], listBody, walletClient),
    ]);

    const results = [summaryRes, domainsRes, backlinksRes];

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
      summary: summaryRes.status === "ok" ? extractSummary(summaryRes.envelope) : null,
      referringDomains:
        domainsRes.status === "ok" ? extractReferringDomains(domainsRes.envelope) : [],
      backlinks: backlinksRes.status === "ok" ? extractBacklinks(backlinksRes.envelope) : [],
    });
    setStatus("success");
  }, []);

  return { status, data, error, run, reset };
}

function firstErrorMessage(results: PaidPostResult<unknown>[]): string {
  const err = results.find((r) => r.status === "error");
  return err && err.status === "error" ? err.message : "The request failed.";
}
