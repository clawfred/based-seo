/**
 * One charge path for every paid endpoint.
 *
 * The ordering is the whole point: **verify, then do the work, then settle.**
 * The code this replaces settled on-chain before calling DataForSEO and before
 * validating input, so a malformed keyword or an upstream 502 left the caller
 * charged with nothing to show for it — and x402 has no refund primitive.
 *
 * Rail selection:
 *   - a `PAYMENT-SIGNATURE` header means the caller explicitly signed a payment;
 *     honour it, so a signed authorization is never left dangling unused.
 *   - otherwise an authenticated account with funds pays from balance and never
 *     sees a 402.
 *   - otherwise the caller gets a spec-standard 402 challenge. An agent with a
 *     conforming x402 client retries with a signed payment and never needs to
 *     know a balance system exists.
 */

import type { NextRequest } from "next/server";

import { hasCredentials } from "@/lib/dataforseo/client";
import { HEADER_PAYMENT_SIGNATURE } from "@/lib/x402/constants";
import { getX402Server, initX402Once } from "@/lib/x402/server";
import { captureHold, holdFunds, releaseHold, sweepExpiredHolds, type LedgerDb } from "./ledger";

/**
 * The minimum a thing must know about itself to be charged for. Both a registry
 * passthrough (`RequestQuote`) and a composite product satisfy it, so the two
 * share one settle-after-work path rather than growing separate payment code.
 */
export interface Chargeable {
  /** Identifies the charge in the ledger. */
  readonly slug: string;
  readonly billable: boolean;
  /** Long-running task endpoints get a longer hold before the sweeper reclaims. */
  readonly isTaskPost: boolean;
  readonly micros: number;
  /** x402 money string, e.g. "$0.0006". */
  readonly formatted: string;
  /** The exact payload forwarded upstream; also what x402 prices. */
  readonly body: unknown;
}

/** How long a hold may sit unresolved before the sweeper releases it. */
const LIVE_HOLD_TTL_MS = 3 * 60_000;
const TASK_HOLD_TTL_MS = 24 * 60 * 60_000;

export type ChargeSource = "balance" | "x402" | "free";

export interface ChargeSuccess {
  readonly ok: true;
  readonly source: ChargeSource;
  readonly amountMicros: number;
  readonly balanceRemainingMicros?: bigint;
  /** Headers to merge into the 200 response (x402 settlement receipt). */
  readonly headers: Record<string, string>;
}

export interface ChargeRejected {
  readonly ok: false;
  readonly status: number;
  readonly body: unknown;
  readonly headers: Record<string, string>;
}

export type ChargeOutcome = ChargeSuccess | ChargeRejected;

/** The work to perform once payment is authorized but before it is captured. */
export type Work<T> = () => Promise<T>;

export interface ChargeContext {
  readonly req: NextRequest;
  readonly quote: Chargeable;
  /** Privy user id, or null for a wallet-only agent. */
  readonly accountId: string | null;
  readonly idempotencyKey: string | null;
  readonly db: LedgerDb | null;
}

export class WorkFailed extends Error {
  readonly status: number;
  readonly detail: unknown;
  constructor(status: number, detail: unknown) {
    super("upstream work failed");
    this.name = "WorkFailed";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Run `work` exactly once, charging for it only if it succeeds.
 *
 * Returns the work's value alongside the charge outcome. If `work` throws, no
 * money moves on either rail: a hold is released, and an x402 payment is never
 * settled (the signed authorization simply goes unused and its nonce stays
 * unconsumed, so the caller may retry it).
 */
export async function chargeAndRun<T>(
  ctx: ChargeContext,
  work: Work<T>,
): Promise<{ charge: ChargeOutcome; value?: T }> {
  const { quote } = ctx;

  // Refuse to quote, hold, or 402 when we cannot actually fetch the data.
  // Serving fabricated results for real money is worse than an outage.
  if (!hasCredentials()) {
    return {
      charge: {
        ok: false,
        status: 503,
        body: { error: "UPSTREAM_UNCONFIGURED", message: "SEO data provider is unavailable." },
        headers: {},
      },
    };
  }

  if (!quote.billable || quote.micros === 0) {
    const value = await work();
    return { charge: { ok: true, source: "free", amountMicros: 0, headers: {} }, value };
  }

  const signed = ctx.req.headers.get(HEADER_PAYMENT_SIGNATURE);
  if (!signed && ctx.accountId && ctx.db) {
    const viaBalance = await chargeFromBalance(ctx, work);
    // `null` means insufficient funds: fall through to a 402 challenge.
    if (viaBalance) return viaBalance;
  }

  return chargeViaX402(ctx, work);
}

async function chargeFromBalance<T>(
  ctx: ChargeContext,
  work: Work<T>,
): Promise<{ charge: ChargeOutcome; value?: T } | null> {
  const { db, accountId, quote } = ctx;
  if (!db || !accountId) return null;

  // Self-heal: reclaim this account's own stranded holds before we try to place
  // a new one, so a crash on a prior request can't lock a user out of their own
  // balance until the daily cron runs. Scoped to one account and best-effort.
  await sweepExpiredHolds(db, new Date(), accountId).catch(() => {});

  const ttl = quote.isTaskPost ? TASK_HOLD_TTL_MS : LIVE_HOLD_TTL_MS;
  const held = await holdFunds(db, {
    accountId,
    priceMicros: BigInt(quote.micros),
    endpoint: quote.slug,
    requestId: ctx.idempotencyKey,
    expiresAt: new Date(Date.now() + ttl),
    userId: accountId,
  });

  if (!held.ok) {
    if (held.reason === "duplicate_request") {
      return {
        charge: {
          ok: false,
          status: 409,
          body: {
            error: "DUPLICATE_REQUEST",
            message: "This Idempotency-Key was already used. Retry with a new key.",
          },
          headers: {},
        },
      };
    }
    return null; // insufficient funds -> x402
  }

  let value: T;
  try {
    value = await work();
  } catch (err) {
    await releaseHold(db, held.hold.holdId);
    throw err;
  }

  // Capture is guarded on status='held'. If the sweeper beat us we were already
  // refunded, so we must NOT hand over the paid result.
  const captured = await captureHold(db, held.hold.holdId);
  if (!captured) {
    return {
      charge: {
        ok: false,
        status: 409,
        body: {
          error: "HOLD_EXPIRED",
          message: "The request outlived its payment hold and was refunded. Please retry.",
        },
        headers: {},
      },
    };
  }

  return {
    charge: {
      ok: true,
      source: "balance",
      amountMicros: quote.micros,
      balanceRemainingMicros: held.hold.balanceAfterMicros,
      headers: {},
    },
    value,
  };
}

async function chargeViaX402<T>(
  ctx: ChargeContext,
  work: Work<T>,
): Promise<{ charge: ChargeOutcome; value?: T }> {
  await initX402Once();
  const server = getX402Server();

  const result = await server.processHTTPRequest({
    adapter: makeAdapter(ctx),
    path: new URL(ctx.req.url).pathname,
    method: ctx.req.method,
    paymentHeader: ctx.req.headers.get(HEADER_PAYMENT_SIGNATURE) ?? undefined,
  });

  if (result.type === "no-payment-required") {
    // The wildcard route covers everything under /api/v3, so this means the
    // route table and the registry disagree. Failing closed beats serving free.
    throw new Error(`x402 reported no payment required for billable endpoint ${ctx.quote.slug}`);
  }

  if (result.type === "payment-error") {
    return {
      charge: {
        ok: false,
        status: result.response.status,
        body: result.response.body ?? {},
        headers: Object.fromEntries(new Headers(result.response.headers).entries()),
      },
    };
  }

  // Payment is verified but NOT yet settled. Do the work first.
  const value = await work();

  const settle = await server.processSettlement(result.paymentPayload, result.paymentRequirements);

  if (!settle.success) {
    // We already paid DataForSEO for this. Eating that cost is the correct
    // asymmetry: the alternative charges the caller and hands them nothing.
    return {
      charge: {
        ok: false,
        status: 402,
        body: { error: "SETTLEMENT_FAILED", message: settle.errorReason },
        headers: {},
      },
    };
  }

  return {
    charge: {
      ok: true,
      source: "x402",
      amountMicros: ctx.quote.micros,
      headers: settle.headers ?? {},
    },
    value,
  };
}

/**
 * x402's adapter contract, backed by the body the route already read.
 *
 * A NextRequest body is a one-shot stream; letting x402 re-read it would throw.
 * `quote.body` is the validated form of that body, so serving it here also
 * guarantees the price x402 computes matches the payload we forward.
 */
function makeAdapter(ctx: ChargeContext) {
  const url = new URL(ctx.req.url);
  return {
    getHeader: (name: string) => ctx.req.headers.get(name) ?? undefined,
    getMethod: () => ctx.req.method,
    getPath: () => url.pathname,
    getUrl: () => ctx.req.url,
    getAcceptHeader: () => ctx.req.headers.get("accept") ?? "",
    getUserAgent: () => ctx.req.headers.get("user-agent") ?? "",
    getQueryParams: () => Object.fromEntries(url.searchParams.entries()),
    getQueryParam: (name: string) => url.searchParams.get(name) ?? undefined,
    getBody: async () => ctx.quote.body,
  };
}
