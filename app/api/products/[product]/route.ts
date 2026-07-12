/**
 * Composite products for the dashboard.
 *
 * Replaces /api/keywords/overview, /api/keywords/ideas and /api/serp, which all
 * settled payment before validating input and before calling DataForSEO. A bad
 * keyword or an upstream outage charged the caller and returned an error, and
 * x402 has no refund primitive. Here the charge is captured only after every
 * component call has succeeded.
 */

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { checkRateLimit } from "@/lib/api-middleware";
import { verifyAuth } from "@/lib/auth";
import { chargeAndRun, type ChargeContext } from "@/lib/billing/charge";
import { QuoteError } from "@/lib/billing/quote";
import { callDataForSEO } from "@/lib/dataforseo/client";
import {
  DataForSEOAuthError,
  DataForSEORequestError,
  DataForSEOUpstreamError,
} from "@/lib/dataforseo/errors";
import { componentsOf } from "@/lib/products";
import { quoteProduct } from "@/lib/products/quote";
import {
  HEADER_BALANCE_REMAINING,
  HEADER_CHARGE_AMOUNT,
  HEADER_CHARGE_SOURCE,
  HEADER_IDEMPOTENCY_KEY,
} from "@/lib/x402/constants";
import { NetworkConfigError } from "@/lib/x402/network";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ product: string }> },
): Promise<NextResponse> {
  const { product: productSlug } = await params;

  const throttled = await checkRateLimit(req);
  if (throttled) return throttled;

  let body: unknown;
  try {
    const raw = await req.text();
    body = raw ? JSON.parse(raw) : undefined;
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body is not valid JSON." },
      { status: 400 },
    );
  }

  let quote;
  try {
    quote = quoteProduct(productSlug, body);
  } catch (err) {
    if (err instanceof QuoteError) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: err.message },
        { status: err.status },
      );
    }
    throw err;
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
    const { charge, value } = await chargeAndRun(chargeCtx, async () => {
      const components = componentsOf(quote.product);

      // Fan out over (keyword x component). Any rejection aborts before capture,
      // so a partial failure charges nothing rather than billing for half a result.
      const perKeyword = await Promise.all(
        quote.keywords.map(async (keyword) => {
          const task = {
            keyword,
            location_code: quote.locationCode,
            language_code: quote.languageCode,
          };

          const parts = await Promise.all(
            components.map(async (endpoint) => {
              const envelope = await callDataForSEO({
                dfsPath: endpoint.dfsPath,
                method: endpoint.method,
                tasks: [task],
              });
              return [endpoint.slug, envelope.tasks?.[0]?.result ?? null] as const;
            }),
          );

          return { keyword, results: Object.fromEntries(parts) };
        }),
      );

      // A single-keyword request reads as one object; a batch reads as a list.
      return quote.keywords.length === 1 ? perKeyword[0].results : perKeyword;
    });

    if (!charge.ok) {
      return NextResponse.json(charge.body as object, {
        status: charge.status,
        headers: charge.headers,
      });
    }

    const res = NextResponse.json({
      product: quote.product.id,
      keywords: quote.keywords.length,
      price: { usd: quote.usd },
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

function errorResponse(err: unknown): NextResponse {
  if (err instanceof DataForSEORequestError) {
    return NextResponse.json({ error: "UPSTREAM_REJECTED", message: err.message }, { status: 400 });
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
  console.error("[api/products] unhandled", err);
  return NextResponse.json(
    { error: "INTERNAL", message: "Internal server error." },
    { status: 500 },
  );
}
