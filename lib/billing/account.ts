/**
 * Account state for the funding UI: the on-chain allowance reconciled with the
 * ledger tab. Read-only aggregation; mutations live in `allowance.ts`.
 */

import { sql } from "drizzle-orm";

import { microsToUsd } from "@/lib/registry/pricing";
import { getNetworkConfig } from "@/lib/x402/network";
import { readAllowanceState } from "@/lib/x402/usdc";
import { syncTabAccount } from "./allowance";
import type { LedgerDb } from "./ledger";

export interface AccountState {
  /** Ledger balance in micro-USD. Negative on a tab means an outstanding receivable. */
  balanceMicros: number;
  floorMicros: number;
  /** min(allowance, walletBalance), the real cap. */
  spendableMicros: number;
  /** Headroom left to spend right now = spendable - outstanding. */
  remainingMicros: number;
  allowanceMicros: number;
  walletBalanceMicros: number;
  spender: `0x${string}`;
  usdcAddress: `0x${string}`;
  network: string;
  usd: { balance: number; spendable: number; remaining: number };
}

function rows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows?: T[] })?.rows ?? [];
}

/**
 * Read the wallet's on-chain allowance and reconcile it with the ledger tab,
 * returning the combined state the UI shows. Also seeds/updates the tab floor so
 * a freshly-approved allowance is immediately spendable.
 */
export async function getAccountState(
  db: LedgerDb,
  accountId: string,
  wallet: `0x${string}`,
): Promise<AccountState> {
  const chain = await readAllowanceState(wallet);
  const { floorMicros } = await syncTabAccount(db, accountId, chain.spendableMicros);

  const balRow = rows<{ balance_micros: string }>(
    await db.execute(
      sql`SELECT balance_micros FROM account_balances WHERE account_id = ${accountId}`,
    ),
  )[0];
  const balanceMicros = Number(balRow?.balance_micros ?? 0);
  const outstanding = balanceMicros < 0 ? -balanceMicros : 0;
  const remainingMicros = Math.max(0, chain.spendableMicros - outstanding);

  const net = getNetworkConfig();
  return {
    balanceMicros,
    floorMicros: Number(floorMicros),
    spendableMicros: chain.spendableMicros,
    remainingMicros,
    allowanceMicros: chain.allowanceMicros,
    walletBalanceMicros: chain.balanceMicros,
    spender: chain.spender,
    usdcAddress: net.usdcAddress,
    network: net.network,
    usd: {
      balance: microsToUsd(balanceMicros),
      spendable: microsToUsd(chain.spendableMicros),
      remaining: microsToUsd(remainingMicros),
    },
  };
}
