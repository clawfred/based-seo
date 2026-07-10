/**
 * Retail pricing, derived from DataForSEO's cost to us.
 *
 * The product promise is cost pass-through, so markup defaults to zero. Two
 * adjustments protect against charging less than the upstream call costs:
 *
 *  - x402's `exact` scheme settles a fixed USDC amount, and USDC has 6 decimals.
 *    Prices are rounded UP to the cent, never down.
 *  - 22 endpoints have no published DataForSEO price. The registry already
 *    substituted the most expensive published price in their group; they carry
 *    `priceConfidence: "estimated"` and that fact is exposed to callers.
 */

import type { EndpointDef } from "./types";

/**
 * Basis points added on top of DataForSEO's cost. 0 = exact pass-through, which
 * is what the README promises. Override per-deployment.
 */
const MARKUP_BPS = Number.parseInt(process.env.PLATFORM_MARKUP_BPS ?? "0", 10);

/** Never issue a 402 for less than this; below it, gas and facilitator overhead dominate. */
const MIN_BILLABLE_USD = 0.001;

export interface PriceQuote {
  /** USD, rounded up to the cent. Format expected by x402: `"$0.03"`. */
  readonly usd: number;
  readonly formatted: string;
  /** What DataForSEO charges us. Exposed so callers can audit the markup. */
  readonly upstreamCostUsd: number;
  readonly markupBps: number;
  readonly confidence: EndpointDef["priceConfidence"];
}

/** Round up to the cent. Ceil, so we never settle below upstream cost. */
function ceilCents(usd: number): number {
  return Math.ceil(usd * 100 - 1e-9) / 100;
}

export function quote(endpoint: EndpointDef): PriceQuote {
  const withMarkup = endpoint.dfsCostUsd * (1 + MARKUP_BPS / 10_000);
  const usd = endpoint.billable ? Math.max(ceilCents(withMarkup), MIN_BILLABLE_USD) : 0;

  return {
    usd,
    formatted: `$${usd.toFixed(2)}`,
    upstreamCostUsd: endpoint.dfsCostUsd,
    markupBps: MARKUP_BPS,
    confidence: endpoint.priceConfidence,
  };
}

/**
 * Price for a request that may fan out to N upstream tasks. DataForSEO bills
 * per task in the array, so N tasks cost N x the unit price. Callers must
 * validate that the number they paid for equals the number they submit.
 */
export function quoteBatch(endpoint: EndpointDef, taskCount: number): PriceQuote {
  const n = Math.max(1, taskCount);
  const base = quote(endpoint);
  if (!endpoint.billable) return base;

  const usd = Math.max(ceilCents(base.usd * n), MIN_BILLABLE_USD);
  return { ...base, usd, formatted: `$${usd.toFixed(2)}`, upstreamCostUsd: endpoint.dfsCostUsd * n };
}
