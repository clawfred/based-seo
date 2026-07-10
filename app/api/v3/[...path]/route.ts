/**
 * The paid passthrough. One handler, 351 public DataForSEO endpoints.
 *
 * Order of operations is load-bearing:
 *   1. rate limit        — throttled requests are free
 *   2. resolve + validate — malformed requests are free
 *   3. authorize payment  — verify (x402) or hold (balance)
 *   4. call DataForSEO    — the actual work
 *   5. settle / capture   — only now does money move
 *
 * A failure at any step before 5 leaves the caller uncharged.
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { verifyAuth } from "@/lib/auth";
import { chargeAndRun, type ChargeContext } from "@/lib/billing/charge";
import { QuoteError, quoteFor } from "@/lib/billing/quote";
import { buildPath, callDataForSEO } from "@/lib/dataforseo/client";
import {
  DataForSEOAuthError,
  DataForSEORequestError,
  DataForSEOUpstreamError,
} from "@/lib/dataforseo/errors";
import { checkRateLimit } from "@/lib/api-middleware";
import {
  HEADER_BALANCE_REMAINING,
  HEADER_CHARGE_AMOUNT,
  HEADER_CHARGE_SOURCE,
  HEADER_IDEMPOTENCY_KEY,
} from "@/lib/x402/constants";
import { NetworkConfigError } from "@/lib/x402/network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path: string[] }> };

export async function POST(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

/** Free reference endpoints (locations, languages, errors) are GET. */
export async function GET(req: NextRequest, ctx: Params) {
  return handle(req, ctx);
}

async function handle(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { path } = await params;

  const throttled = await checkRateLimit(req);
  if (throttled) return throttled;

  let body: unknown;
  if (req.method === "POST") {
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      return NextResponse.json(
        { error: "INVALID_JSON", message: "Request body is not valid JSON." },
        { status: 400 },
      );
    }
  }

  let quote;
  try {
    quote = quoteFor(path, body);
  } catch (err) {
    if (err instanceof QuoteError) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: err.message },
        { status: err.status },
      );
    }
    throw err;
  }

  if (quote.endpoint.method !== req.method) {
    return NextResponse.json(
      {
        error: "METHOD_NOT_ALLOWED",
        message: `${quote.endpoint.slug} expects ${quote.endpoint.method}.`,
      },
      { status: 405 },
    );
  }

  const user = await verifyAuth(req);

  const chargeCtx: ChargeContext = {
    req,
    quote,
    accountId: user?.userId ?? null,
    idempotencyKey: req.headers.get(HEADER_IDEMPOTENCY_KEY),
    db,
  };

  try {
    const { charge, value } = await chargeAndRun(chargeCtx, async () =>
      callDataForSEO({
        dfsPath: buildPath(
          quote.endpoint.dfsPath,
          quote.endpoint.pathParams.map((p) => quote.pathParams[p]),
        ),
        method: quote.endpoint.method,
        // The tasks we priced, never the caller's raw body.
        tasks: quote.tasks,
      }),
    );

    if (!charge.ok) {
      return NextResponse.json(charge.body as object, {
        status: charge.status,
        headers: charge.headers,
      });
    }

    const res = NextResponse.json({
      endpoint: quote.endpoint.slug,
      price: { usd: quote.usd, confidence: quote.confidence },
      data: value,
    });

    for (const [k, v] of Object.entries(charge.headers)) res.headers.set(k, v);
    res.headers.set(HEADER_CHARGE_SOURCE, charge.source);
    res.headers.set(HEADER_CHARGE_AMOUNT, quote.formatted);
    if (charge.balanceRemainingMicros !== undefined) {
      res.headers.set(HEADER_BALANCE_REMAINING, charge.balanceRemainingMicros.toString());
    }
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Upstream failures reach here only after any hold has been released and before
 * any settlement, so the caller has not been charged.
 */
function errorResponse(err: unknown): NextResponse {
  if (err instanceof DataForSEORequestError) {
    return NextResponse.json(
      { error: "UPSTREAM_REJECTED", message: err.message, upstreamStatus: err.statusCode },
      { status: 400 },
    );
  }
  if (err instanceof DataForSEOAuthError) {
    console.error("[dataforseo] auth failure", err);
    return NextResponse.json(
      { error: "UPSTREAM_UNCONFIGURED", message: "SEO data provider is unavailable." },
      { status: 503 },
    );
  }
  if (err instanceof DataForSEOUpstreamError) {
    return NextResponse.json({ error: "UPSTREAM_ERROR", message: err.message }, { status: 502 });
  }
  if (err instanceof NetworkConfigError) {
    console.error("[x402] misconfigured", err);
    return NextResponse.json(
      { error: "PAYMENT_UNCONFIGURED", message: "Payments are not configured." },
      { status: 503 },
    );
  }

  console.error("[api/v3] unhandled", err);
  return NextResponse.json(
    { error: "INTERNAL", message: "Internal server error." },
    { status: 500 },
  );
}
