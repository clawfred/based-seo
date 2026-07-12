/**
 * Collapse the five independent runner states into one status the page renders.
 * Pure so the report hook stays thin and this stays trivially testable.
 */

import type { RunState } from "@/hooks/use-endpoint-runner";

export type ReportStatus = "idle" | "loading" | "paywall" | "error" | "success";

/**
 * Precedence, mirroring the backlinks flagship:
 *   - nothing started            -> idle
 *   - anything still in flight   -> loading
 *   - at least one returned data -> success (partial tabs just render empty)
 *   - every call wants payment   -> paywall
 *   - otherwise                  -> error
 */
export function deriveStatus(states: RunState[]): ReportStatus {
  if (states.every((s) => s.status === "idle")) return "idle";
  if (states.some((s) => s.status === "running")) return "loading";
  if (states.some((s) => s.status === "success")) return "success";
  if (states.length > 0 && states.every((s) => s.status === "needs-payment")) return "paywall";
  return "error";
}

/** First error message across the runners, for the error banner. */
export function firstError(states: RunState[]): string | null {
  const hit = states.find((s) => s.status === "error");
  return hit && hit.status === "error" ? hit.message : null;
}
