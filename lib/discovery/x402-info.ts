/**
 * Resolve the x402 payment metadata advertised by the discovery surface.
 *
 * The discovery endpoints are public and must succeed even when the payment
 * env is missing (CI, a fresh clone, a preview deploy). `getNetworkConfig` and
 * `getPayToAddress` throw by design when unset, so we catch and degrade to an
 * `unconfigured` block rather than 500-ing the manifest.
 */

import { getNetworkConfig, getPayToAddress } from "@/lib/x402/network";
import type { X402PaymentInfo } from "./types";

const HEADERS = {
  paymentRequired: "PAYMENT-REQUIRED",
  paymentSignature: "PAYMENT-SIGNATURE",
  paymentResponse: "PAYMENT-RESPONSE",
} as const;

export function resolveX402Info(): X402PaymentInfo {
  try {
    const net = getNetworkConfig();
    const payTo = getPayToAddress();
    return {
      protocol: "x402",
      version: 2,
      scheme: "exact",
      configured: true,
      network: net.network,
      caip2: net.caip2,
      chainId: net.chainId,
      asset: { symbol: "USDC", address: net.usdcAddress, decimals: 6 },
      payTo,
      facilitator: net.facilitatorUrl,
      isMainnet: net.isMainnet,
      headers: HEADERS,
    };
  } catch {
    return {
      protocol: "x402",
      version: 2,
      scheme: "exact",
      configured: false,
      network: null,
      caip2: null,
      chainId: null,
      asset: { symbol: "USDC", address: null, decimals: 6 },
      payTo: null,
      facilitator: null,
      isMainnet: null,
      headers: HEADERS,
      note:
        "Payment target not configured on this deployment. The live 402 response " +
        "on each billable endpoint carries the authoritative payTo, network, and amount.",
    };
  }
}
