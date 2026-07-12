"use client";

import { useCallback, useMemo, useState } from "react";
import { useEndpointRunner, type RunState } from "@/hooks/use-endpoint-runner";
import {
  DOMAIN_SLUGS,
  DEFAULT_LOCATION_CODE,
  DEFAULT_LANGUAGE_CODE,
  KEYWORDS_LIMIT,
  COMPETITORS_LIMIT,
} from "@/components/domain/constants";
import { deriveStatus, firstError, type ReportStatus } from "@/components/domain/report-status";
import {
  extractOverview,
  extractKeywords,
  extractCompetitors,
  extractTechnologies,
} from "@/components/domain/extract";
import type { DomainReport } from "@/components/domain/domain-types";

export interface DomainReportQuery {
  status: ReportStatus;
  report: DomainReport | null;
  error: string | null;
  /** Kicks off all five endpoints. The connected wallet (if any) pays via x402. */
  run: (target: string) => void;
  hasWallet: boolean;
}

/** The envelope a successful runner exposes, else null. */
function dataOf(state: RunState): unknown {
  return state.status === "success" ? state.data : null;
}

/**
 * Orchestrates the five paid calls behind a domain report, one shared
 * `useEndpointRunner` per endpoint. Each runner owns its own pay/retry loop; we
 * only fan the target out and fold the five states into a single status + report.
 */
export function useDomainReport(): DomainReportQuery {
  const rank = useEndpointRunner();
  const summary = useEndpointRunner();
  const keywords = useEndpointRunner();
  const competitors = useEndpointRunner();
  const tech = useEndpointRunner();
  const [target, setTarget] = useState("");

  const run = useCallback(
    (rawTarget: string) => {
      const trimmed = rawTarget.trim();
      if (!trimmed) return;
      setTarget(trimmed);

      const geo = { location_code: DEFAULT_LOCATION_CODE, language_code: DEFAULT_LANGUAGE_CODE };
      rank.run({
        slug: DOMAIN_SLUGS.rankOverview,
        method: "POST",
        body: { target: trimmed, ...geo },
      });
      summary.run({
        slug: DOMAIN_SLUGS.backlinksSummary,
        method: "POST",
        body: { target: trimmed },
      });
      keywords.run({
        slug: DOMAIN_SLUGS.rankedKeywords,
        method: "POST",
        body: { target: trimmed, ...geo, limit: KEYWORDS_LIMIT },
      });
      competitors.run({
        slug: DOMAIN_SLUGS.competitors,
        method: "POST",
        body: { target: trimmed, ...geo, limit: COMPETITORS_LIMIT },
      });
      tech.run({ slug: DOMAIN_SLUGS.technologies, method: "POST", body: { target: trimmed } });
    },
    [rank, summary, keywords, competitors, tech],
  );

  const states = [rank.state, summary.state, keywords.state, competitors.state, tech.state];
  const status = deriveStatus(states);
  const error = status === "error" ? firstError(states) : null;

  const report = useMemo<DomainReport | null>(() => {
    if (status !== "success" || !target) return null;
    return {
      target,
      overview: extractOverview(dataOf(rank.state), dataOf(summary.state)),
      keywords: extractKeywords(dataOf(keywords.state)),
      competitors: extractCompetitors(dataOf(competitors.state)),
      technologies: extractTechnologies(dataOf(tech.state)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, target, rank.state, summary.state, keywords.state, competitors.state, tech.state]);

  return { status, report, error, run, hasWallet: rank.hasWallet };
}
