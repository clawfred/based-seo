"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WalletClient } from "viem";

import {
  startCrawl,
  fetchSummary,
  fetchPages,
  fetchLinks,
  type StartedCrawl,
} from "@/components/site-audit/audit-api";
import type { AuditData, AuditSummary } from "@/components/site-audit/audit-types";

/** How long to wait between summary polls, and how many polls before we stop. */
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

export type AuditStatus = "idle" | "paying" | "paywall" | "crawling" | "ready" | "error";

export interface SiteAuditState {
  status: AuditStatus;
  /** The submitted target, echoed while crawling and in results. */
  target: string;
  /** Live summary — drives the progress panel, then the results hero. */
  summary: AuditSummary | null;
  /** Final result tables, present once status is "ready". */
  data: AuditData | null;
  error: string | null;
  /** Which poll we're on (1-based), for the crawling panel. */
  pollCount: number;
  run: (target: string, maxCrawlPages: number, walletClient?: WalletClient) => void;
  reset: () => void;
}

/**
 * Owns the Site Audit lifecycle end-to-end: pay to start the async crawl, poll
 * the free summary until it finishes, then pull the result tables. A `runId` ref
 * fences every async step so a reset or a fresh run abandons any in-flight loop
 * instead of writing stale state.
 */
export function useSiteAudit(): SiteAuditState {
  const [status, setStatus] = useState<AuditStatus>("idle");
  const [target, setTarget] = useState("");
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Bumped on every run/reset; a loop whose id no longer matches bails out.
  const runId = useRef(0);
  // Mirrors of the latest values the polling closure needs to read fresh.
  const summaryRef = useRef<AuditSummary | null>(null);
  const targetRef = useRef("");
  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // Abandon any in-flight loop when the component unmounts.
  useEffect(() => () => void (runId.current += 1), []);

  /** Fetch the result tables once the crawl is done and flip to "ready". */
  const loadResults = useCallback(
    async (crawl: StartedCrawl, finalSummary: AuditSummary | null, alive: () => boolean) => {
      // Tables are independent; a failure on one shouldn't sink the report.
      const [pages, links] = await Promise.all([
        fetchPages(crawl.taskId, crawl.capabilityToken).catch(() => []),
        fetchLinks(crawl.taskId, crawl.capabilityToken).catch(() => []),
      ]);
      if (!alive()) return;

      setData({ target: targetRef.current, summary: finalSummary, pages, links });
      setStatus("ready");
    },
    [],
  );

  /** Poll summary on an interval until the crawl finishes or we hit the cap. */
  const pollUntilFinished = useCallback(
    async (crawl: StartedCrawl, alive: () => boolean) => {
      for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
        if (!alive()) return;
        setPollCount(attempt);

        try {
          const poll = await fetchSummary(crawl.taskId, crawl.capabilityToken);
          if (!alive()) return;
          if (poll.summary) setSummary(poll.summary);

          if (poll.crawlProgress === "finished") {
            await loadResults(crawl, poll.summary, alive);
            return;
          }
        } catch (err) {
          if (!alive()) return;
          // Early polls can race the crawl's bootstrap; only surface an error if
          // we exhaust every attempt.
          if (attempt === MAX_POLLS) {
            setError(err instanceof Error ? err.message : "Failed to read crawl progress.");
            setStatus("error");
            return;
          }
        }

        await delay(POLL_INTERVAL_MS);
      }

      // Cap reached without a "finished" signal. Present whatever we have rather
      // than discard a crawl that's likely most of the way done.
      if (!alive()) return;
      if (summaryRef.current) {
        await loadResults(crawl, summaryRef.current, alive);
      } else {
        setError("The crawl is taking longer than expected. Try again in a moment.");
        setStatus("error");
      }
    },
    [loadResults],
  );

  const run = useCallback(
    (rawTarget: string, maxCrawlPages: number, walletClient?: WalletClient) => {
      const cleaned = rawTarget.trim();
      if (!cleaned) return;

      const id = ++runId.current;
      const alive = () => runId.current === id;

      setTarget(cleaned);
      setSummary(null);
      setData(null);
      setError(null);
      setPollCount(0);
      setStatus("paying");

      void (async () => {
        const start = await startCrawl(cleaned, maxCrawlPages, walletClient);
        if (!alive()) return;

        if (start.status === "payment_required") {
          setStatus("paywall");
          return;
        }
        if (start.status === "error") {
          setError(start.message);
          setStatus("error");
          return;
        }

        setStatus("crawling");
        await pollUntilFinished(start.crawl, alive);
      })();
    },
    [pollUntilFinished],
  );

  const reset = useCallback(() => {
    runId.current += 1;
    setStatus("idle");
    setTarget("");
    setSummary(null);
    setData(null);
    setError(null);
    setPollCount(0);
  }, []);

  return { status, target, summary, data, error, pollCount, run, reset };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
