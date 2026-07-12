"use client";

import { useCallback, useState } from "react";
import { useWalletClient } from "wagmi";

import { x402Fetch } from "@/lib/x402-client";

export type RunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "needs-payment"; priceUsd: number }
  | { status: "success"; data: unknown; source: string | null; amount: string | null }
  | { status: "error"; message: string; httpStatus?: number };

interface RunArgs {
  /** Endpoint slug, e.g. `backlinks/summary/live`. */
  slug: string;
  /** HTTP method the endpoint expects. GET endpoints are free reference data. */
  method: "GET" | "POST";
  /** Task body. A single object is wrapped into a one-element array server-side. */
  body: Record<string, unknown>;
}

/**
 * Runs a `/api/v3/{slug}` request, transparently paying via x402 when a wallet
 * is connected.
 *
 * A first unpaid request either succeeds (free endpoint) or comes back 402. On a
 * 402 with a connected wallet, `x402Fetch` signs and retries. Without a wallet,
 * the hook surfaces the quoted price so the UI can prompt a connect.
 */
export function useEndpointRunner() {
  const { data: walletClient } = useWalletClient();
  const [state, setState] = useState<RunState>({ status: "idle" });

  const run = useCallback(
    async ({ slug, method, body }: RunArgs) => {
      setState({ status: "running" });
      const url = `/api/v3/${slug}`;

      try {
        // GET endpoints are free reference data (locations, filters, errors) and
        // never involve payment.
        if (method === "GET") {
          return setState(await toState(await fetch(url)));
        }

        if (walletClient) {
          // x402Fetch handles the 402 -> sign -> retry loop internally.
          const res = await x402Fetch(url, body, walletClient);
          return setState(await toState(res));
        }

        // No wallet: make the unpaid request. Free endpoints return 200; billable
        // ones return 402 and we read the quoted price to prompt a connect.
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.status === 402) {
          return setState({ status: "needs-payment", priceUsd: await priceFrom(res) });
        }
        return setState(await toState(res));
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Request failed",
        });
      }
    },
    [walletClient],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, run, reset, hasWallet: Boolean(walletClient) };
}

async function toState(res: Response): Promise<RunState> {
  const text = await res.text();
  const json = text ? safeParse(text) : null;

  if (res.ok) {
    return {
      status: "success",
      data: (json as { data?: unknown })?.data ?? json,
      source: res.headers.get("x-charge-source"),
      amount: res.headers.get("x-charge-amount"),
    };
  }

  const message =
    (json as { message?: string; error?: string })?.message ??
    (json as { error?: string })?.error ??
    `Request failed (HTTP ${res.status})`;
  return { status: "error", message, httpStatus: res.status };
}

/** x402 puts the quoted amount in the PAYMENT-REQUIRED challenge header. */
async function priceFrom(res: Response): Promise<number> {
  const header = res.headers.get("payment-required");
  if (header) {
    try {
      const decoded = JSON.parse(atob(header));
      const amount = decoded?.accepts?.[0]?.amount;
      if (amount) return Number(amount) / 1e6;
    } catch {
      /* fall through */
    }
  }
  const body = safeParse(await res.text());
  return (body as { price?: { usd?: number } })?.price?.usd ?? 0;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
