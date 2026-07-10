/**
 * Network + facilitator selection.
 *
 * Base mainnet settles real USDC and requires CDP credentials. Base Sepolia
 * settles faucet USDC through the public x402.org facilitator and needs no
 * credentials, which is what makes the payment flow testable end-to-end
 * without spending money.
 *
 * Selection is explicit via X402_NETWORK. There is deliberately no "guess from
 * NODE_ENV" fallback: silently settling real USDC because an env var was unset
 * is the exact failure this module exists to prevent.
 */

export type X402Network = "base" | "base-sepolia";

export interface NetworkConfig {
  readonly network: X402Network;
  /** CAIP-2 chain id, the form x402 v2 expects. */
  readonly caip2: `eip155:${number}`;
  readonly chainId: number;
  /** USDC contract implementing EIP-3009 `transferWithAuthorization`. */
  readonly usdcAddress: `0x${string}`;
  readonly facilitatorUrl: string;
  /** Whether the facilitator requires CDP_API_KEY_ID / CDP_API_KEY_SECRET. */
  readonly requiresCdpAuth: boolean;
  /** True when settlement moves real money. */
  readonly isMainnet: boolean;
}

const CONFIGS: Record<X402Network, NetworkConfig> = {
  base: {
    network: "base",
    caip2: "eip155:8453",
    chainId: 8453,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    facilitatorUrl: "https://api.cdp.coinbase.com",
    requiresCdpAuth: true,
    isMainnet: true,
  },
  "base-sepolia": {
    network: "base-sepolia",
    caip2: "eip155:84532",
    chainId: 84532,
    // Circle's testnet USDC on Base Sepolia.
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    facilitatorUrl: "https://facilitator.x402.org",
    requiresCdpAuth: false,
    isMainnet: false,
  },
};

export class NetworkConfigError extends Error {}

function parseNetwork(raw: string | undefined): X402Network {
  if (raw === "base" || raw === "base-sepolia") return raw;
  if (raw === undefined || raw === "") {
    throw new NetworkConfigError(
      "X402_NETWORK is not set. Set it to 'base-sepolia' for testing or 'base' for real USDC. " +
        "There is no default: defaulting to mainnet would risk settling real funds unintentionally.",
    );
  }
  throw new NetworkConfigError(
    `X402_NETWORK="${raw}" is not a supported network. Use 'base' or 'base-sepolia'.`,
  );
}

let cached: NetworkConfig | undefined;

export function getNetworkConfig(): NetworkConfig {
  if (cached) return cached;

  const config = CONFIGS[parseNetwork(process.env.X402_NETWORK)];

  if (config.requiresCdpAuth && !(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET)) {
    throw new NetworkConfigError(
      `Network "${config.network}" settles through the CDP facilitator, which requires ` +
        "CDP_API_KEY_ID and CDP_API_KEY_SECRET. Without them /verify and /settle return 401.",
    );
  }

  cached = config;
  return config;
}

/** The address receiving USDC. Validated eagerly: a typo here silently burns funds. */
export function getPayToAddress(): `0x${string}` {
  const addr = process.env.EVM_ADDRESS;
  if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new NetworkConfigError(
      "EVM_ADDRESS must be a 20-byte hex address; payments settle to it and cannot be reversed.",
    );
  }
  return addr as `0x${string}`;
}

/** Test seam. */
export function __resetNetworkConfigCache(): void {
  cached = undefined;
}
