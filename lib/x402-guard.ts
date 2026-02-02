import { NextResponse, type NextRequest } from "next/server";

import { initX402HttpServerOnce, getX402HttpServer, makeNextRequestAdapter } from "@/lib/x402-http";
import { logPaymentTransaction } from "@/lib/payment-logger";
import { verifyAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function requireX402Payment(
  req: NextRequest,
): Promise<
  { ok: true; settleHeaders: Record<string, string> } | { ok: false; response: NextResponse }
> {
  // Ensure we are initialized (fetch supported kinds from facilitator).
  try {
    await initX402HttpServerOnce();
  } catch (e) {
    console.error("[x402] initialize() failed", e);
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "X402_INIT_FAILED",
          message:
            e instanceof Error ? e.message : "Failed to initialize payment server (facilitator).",
        },
        { status: 500 },
      ),
    };
  }

  const httpServer = getX402HttpServer();

  const adapter = makeNextRequestAdapter(req);
  const ctx = {
    adapter,
    path: adapter.getPath(),
    method: adapter.getMethod(),
    // Some clients may pass the raw v2 payment header separately.
    paymentHeader: req.headers.get("payment-signature") ?? undefined,
  };

  const result = await httpServer.processHTTPRequest(ctx);

  if (result.type === "no-payment-required") {
    // Not expected for these endpoints, but allow.
    return { ok: true, settleHeaders: {} };
  }

  if (result.type === "payment-error") {
    const headers = new Headers(result.response.headers);
    const body = result.response.body ?? {};

    return {
      ok: false,
      response: new NextResponse(JSON.stringify(body), {
        status: result.response.status,
        headers: {
          ...Object.fromEntries(headers.entries()),
          "content-type": result.response.isHtml ? "text/html" : "application/json",
        },
      }),
    };
  }

  // payment-verified
  const settle = await httpServer.processSettlement(
    result.paymentPayload,
    result.paymentRequirements,
  );

  if (!settle.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "X402_SETTLE_FAILED",
          message: settle.errorReason,
        },
        { status: 402 },
      ),
    };
  }

  const user = await verifyAuth(req);

  await logPaymentTransaction(
    {
      payer: settle.payer || "unknown",
      transaction: settle.transaction,
      network: settle.network,
      requirements: {
        amount: result.paymentRequirements.amount,
        asset: result.paymentRequirements.asset,
      },
    },
    adapter.getPath(),
    user?.userId,
  );

  return { ok: true, settleHeaders: settle.headers };
}
