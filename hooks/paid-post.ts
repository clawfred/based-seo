/**
 * A single x402-paid POST to the gateway, reduced to a discriminated result the
 * UI can switch on. This is deliberately not a hook: it holds no state and is
 * called (in parallel) by `use-backlinks-query`.
 *
 * Payment strategy:
 *   - wallet connected  -> `x402Fetch`, which pays and retries the 402 itself.
 *     A 402 still coming back means the signature was rejected (it throws).
 *   - no wallet         -> plain fetch; a 402 surfaces as `payment_required`
 *     so the UI can prompt the user to connect and pay.
 */

import type { WalletClient } from "viem";
import { x402Fetch } from "@/lib/x402-client";

export type PaidPostResult<T> =
  | { status: "ok"; envelope: T }
  | { status: "payment_required" }
  | { status: "error"; message: string };

export async function paidPost<T>(
  slug: string,
  body: Record<string, unknown>,
  walletClient?: WalletClient,
): Promise<PaidPostResult<T>> {
  const url = `/api/v3/${slug}`;

  try {
    const res = walletClient
      ? await x402Fetch(url, body, walletClient)
      : await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    if (res.status === 402) {
      return { status: "payment_required" };
    }

    if (!res.ok) {
      return { status: "error", message: await extractError(res) };
    }

    const json = (await res.json()) as { data?: T };
    if (!json.data) {
      return { status: "error", message: "The response did not include any data." };
    }
    return { status: "ok", envelope: json.data };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "The request failed.",
    };
  }
}

async function extractError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `Request failed (${res.status}).`;
  } catch {
    return `Request failed (${res.status}).`;
  }
}
