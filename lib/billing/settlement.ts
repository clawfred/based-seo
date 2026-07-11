/**
 * Tab settlement: collect outstanding receivables by pulling USDC from users'
 * wallets via `transferFrom`, using the allowance they granted.
 *
 * This is the one place the platform holds a signing key, and it is scoped hard:
 * the key can only move USDC that a user has explicitly approved, only to the
 * treasury `payTo` address, and only up to what the user already owes. There is
 * no path here to move more than the allowance authorizes.
 *
 * The on-chain send is gated on `SPENDER_PRIVATE_KEY`. Without it, settlement is
 * a no-op that logs what it *would* pull — safe to deploy before the operational
 * hot wallet is provisioned. The ledger accounting (`recordPull`) is exercised
 * by tests; the transfer itself needs a funded spender to verify.
 */

import { createWalletClient, erc20Abi, http, type Chain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

import { getNetworkConfig, getPayToAddress } from "@/lib/x402/network";
import { recordPull } from "./allowance";
import type { LedgerDb } from "./ledger";

/** Don't pay gas to collect dust. Pull only once a tab crosses this. */
const MIN_PULL_MICROS = 500_000; // $0.50

export interface PullTarget {
  accountId: string;
  ownerWallet: `0x${string}`;
  owedMicros: bigint;
}

export interface PullResult {
  accountId: string;
  outcome: "pulled" | "skipped-below-threshold" | "no-key" | "failed";
  amountMicros?: number;
  txHash?: string;
  error?: string;
}

function hasSpenderKey(): boolean {
  return Boolean(process.env.SPENDER_PRIVATE_KEY);
}

function spenderWallet() {
  const key = process.env.SPENDER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!key) throw new Error("SPENDER_PRIVATE_KEY is not set");
  const net = getNetworkConfig();
  const chain: Chain = net.isMainnet ? base : baseSepolia;
  return {
    account: privateKeyToAccount(key),
    client: createWalletClient({ chain, transport: http() }),
    usdc: net.usdcAddress,
    treasury: getPayToAddress(),
  };
}

/**
 * Pull one account's outstanding receivable. Records the settlement only after
 * the transfer is broadcast, keyed by tx hash so a retry cannot double-credit.
 */
export async function settleAccount(db: LedgerDb, target: PullTarget): Promise<PullResult> {
  const { accountId, ownerWallet, owedMicros } = target;

  if (owedMicros < BigInt(MIN_PULL_MICROS)) {
    return { accountId, outcome: "skipped-below-threshold" };
  }
  if (!hasSpenderKey()) {
    return { accountId, outcome: "no-key", amountMicros: Number(owedMicros) };
  }

  try {
    const { account, client, usdc, treasury } = spenderWallet();
    const txHash = await client.writeContract({
      account,
      address: usdc,
      abi: erc20Abi,
      functionName: "transferFrom",
      args: [ownerWallet, treasury, owedMicros],
      chain: client.chain,
    });

    await recordPull(db, { accountId, amountMicros: owedMicros, txHash });
    return { accountId, outcome: "pulled", amountMicros: Number(owedMicros), txHash };
  } catch (err) {
    return {
      accountId,
      outcome: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
