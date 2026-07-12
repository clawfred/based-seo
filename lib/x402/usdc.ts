/**
 * On-chain USDC reads for the allowance-tab funding model.
 *
 * "Loading up your account" is an ERC-20 allowance, not a deposit: the user
 * signs one `approve(spender, cap)` and the USDC stays in their wallet. We meter
 * spend on the ledger and pull with `transferFrom` in batches. So the funds we
 * can actually count on are `min(allowance, walletBalance)` — an allowance is
 * only real to the extent the wallet still holds the tokens.
 *
 * These are pure reads. The `transferFrom` pull (which needs our spender key)
 * lives in the settlement job, not here.
 */

import { createPublicClient, erc20Abi, http, type Chain } from "viem";
import { base, baseSepolia } from "viem/chains";

import { getNetworkConfig, getPayToAddress } from "./network";

// Typed as the generic `Chain`, not `base | baseSepolia`: those two carry
// different transaction formats (OP-stack deposit txs) and their union makes the
// client type conflict. We only do read-only ERC-20 calls, so `Chain` suffices.
let client: ReturnType<typeof createPublicClient> | undefined;

function publicClient() {
  if (client) return client;
  const chain: Chain = getNetworkConfig().isMainnet ? base : baseSepolia;
  client = createPublicClient({ chain, transport: http() });
  return client;
}

/** USDC has 6 decimals, matching our micro-USD unit exactly. */
export function usdcToMicros(raw: bigint): number {
  return Number(raw);
}

export interface AllowanceState {
  /** Tokens the user authorized us to pull, in micro-USD. */
  allowanceMicros: number;
  /** Tokens the user actually holds, in micro-USD. */
  balanceMicros: number;
  /** What we can rely on: min of the two. This is the real spending cap. */
  spendableMicros: number;
  /** The address the user approves and we pull to. */
  spender: `0x${string}`;
}

export async function readAllowanceState(owner: `0x${string}`): Promise<AllowanceState> {
  const net = getNetworkConfig();
  const spender = getPayToAddress();
  const usdc = net.usdcAddress;
  const pc = publicClient();

  const [allowance, balance] = await Promise.all([
    pc.readContract({
      address: usdc,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    }),
    pc.readContract({ address: usdc, abi: erc20Abi, functionName: "balanceOf", args: [owner] }),
  ]);

  const allowanceMicros = usdcToMicros(allowance);
  const balanceMicros = usdcToMicros(balance);
  return {
    allowanceMicros,
    balanceMicros,
    spendableMicros: Math.min(allowanceMicros, balanceMicros),
    spender,
  };
}

/** Test seam. */
export function __resetUsdcClient(): void {
  client = undefined;
}
