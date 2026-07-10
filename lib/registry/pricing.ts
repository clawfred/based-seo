/**
 * Retail pricing, derived from DataForSEO's cost to us.
 *
 * All arithmetic is in integer micro-USD (10^-6 USD). That is not incidental:
 * USDC has 6 decimals, x402's `exact` scheme settles integer atomic units, and
 * DataForSEO's cheapest endpoints cost $0.0006. Pricing in floats — or worse,
 * rounding to cents — turns a $0.0006 SERP call into "$0.00", which x402 parses
 * as zero atomic units and serves for free. Round up, always, to the micro.
 *
 * The product promise is cost pass-through, so markup defaults to zero.
 */

import type { EndpointDef } from "./types";

/** Basis points on top of DataForSEO's cost. 0 = exact pass-through. */
const MARKUP_BPS = Number.parseInt(process.env.PLATFORM_MARKUP_BPS ?? "0", 10);

/**
 * Floor for a billable request, in micro-USD. Below ~$0.001 the facilitator
 * round-trip and ledger write cost more than the request earns.
 */
const MIN_BILLABLE_MICROS = 1_000;

const MICROS_PER_USD = 1_000_000;

export interface PriceQuote {
  /** Integer micro-USD. The authoritative amount; everything else is derived. */
  readonly micros: number;
  readonly usd: number;
  /** Format x402's money parser accepts: `parseFloat(s.replace(/^\$/, ""))`. */
  readonly formatted: string;
  /** What DataForSEO charges us, in micro-USD. Lets callers audit the markup. */
  readonly upstreamCostMicros: number;
  readonly markupBps: number;
  readonly confidence: EndpointDef["priceConfidence"];
}

export function usdToMicros(usd: number): number {
  return Math.round(usd * MICROS_PER_USD);
}

export function microsToUsd(micros: number): number {
  return micros / MICROS_PER_USD;
}

/**
 * Render micro-USD for x402. Trailing zeros are trimmed but a sub-cent value
 * keeps every significant digit — `600` micros must render `"$0.0006"`, never
 * `"$0.00"`.
 */
export function formatMicros(micros: number): string {
  if (micros === 0) return "$0";
  const s = (micros / MICROS_PER_USD).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  return `$${s}`;
}

function quoteMicros(endpoint: EndpointDef, taskCount: number): number {
  if (!endpoint.billable) return 0;

  const unitCost = usdToMicros(endpoint.dfsCostUsd);
  const n = Math.max(1, Math.floor(taskCount));
  // Ceil after markup so we never settle below what DataForSEO bills us.
  const withMarkup = Math.ceil((unitCost * n * (10_000 + MARKUP_BPS)) / 10_000);
  return Math.max(withMarkup, MIN_BILLABLE_MICROS);
}

function build(endpoint: EndpointDef, taskCount: number): PriceQuote {
  const micros = quoteMicros(endpoint, taskCount);
  return {
    micros,
    usd: microsToUsd(micros),
    formatted: formatMicros(micros),
    upstreamCostMicros: usdToMicros(endpoint.dfsCostUsd) * Math.max(1, Math.floor(taskCount)),
    markupBps: MARKUP_BPS,
    confidence: endpoint.priceConfidence,
  };
}

export function quote(endpoint: EndpointDef): PriceQuote {
  return build(endpoint, 1);
}

/**
 * Price for a request carrying N upstream tasks. DataForSEO bills per task in
 * the array, so callers MUST validate that the task count they priced equals
 * the count they forward upstream.
 */
export function quoteBatch(endpoint: EndpointDef, taskCount: number): PriceQuote {
  return build(endpoint, taskCount);
}
