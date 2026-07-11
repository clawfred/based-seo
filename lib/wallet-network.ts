import { base, baseSepolia } from "wagmi/chains";
import type { Chain } from "viem";

/**
 * Client-side network selection for the wallet UI.
 *
 * Mirrors the server's X402_NETWORK, but read from a NEXT_PUBLIC_ var because
 * this runs in the browser. It must match the server: if the app quotes prices
 * on Base Sepolia but the wallet is on Base mainnet, every payment fails. There
 * is deliberately no default to mainnet — an unset var falls back to testnet, so
 * a misconfiguration never silently spends real USDC.
 */
export type WalletNetwork = "base" | "base-sepolia";

export function walletNetwork(): WalletNetwork {
  return process.env.NEXT_PUBLIC_X402_NETWORK === "base" ? "base" : "base-sepolia";
}

export function isMainnet(): boolean {
  return walletNetwork() === "base";
}

export function activeChain(): Chain {
  return isMainnet() ? base : baseSepolia;
}

/** USDC contract for the active network. */
export function usdcAddress(): `0x${string}` {
  return isMainnet()
    ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    : "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
}
