import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { facilitator } from "@coinbase/x402";
import type { RoutesConfig } from "@x402/core/server";

const evmAddress = process.env.EVM_ADDRESS || "";

const facilitatorClient = new HTTPFacilitatorClient(facilitator);

export const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);

export const routes: RoutesConfig = {
  "/api/keywords/overview": {
    accepts: {
      scheme: "exact",
      network: "eip155:8453", // Base mainnet
      payTo: evmAddress,
      price: "$0.03",
      maxTimeoutSeconds: 3600,
    },
    description: "Keyword overview (search volume, difficulty, CPC)",
    mimeType: "application/json",
  },

  // Batch endpoint: charge once for N keywords.
  // Client MUST include `x-keyword-count` header so we can compute dynamic price.
  "/api/keywords/overview/batch": {
    accepts: {
      scheme: "exact",
      network: "eip155:8453", // Base mainnet
      payTo: evmAddress,
      price: async (ctx) => {
        const raw = ctx.adapter.getHeader("x-keyword-count") || "1";
        const n = Math.max(1, Math.min(25, Number.parseInt(raw, 10) || 1));
        // $0.03 per keyword
        const amount = 0.03 * n;
        return `$${amount.toFixed(2)}`;
      },
      maxTimeoutSeconds: 3600,
    },
    description: "Keyword overview batch (single payment for multiple keywords)",
    mimeType: "application/json",
  },

  "/api/keywords/ideas": {
    accepts: {
      scheme: "exact",
      network: "eip155:8453", // Base mainnet
      payTo: evmAddress,
      price: "$0.025",
      maxTimeoutSeconds: 3600,
    },
    description: "Keyword ideas and suggestions",
    mimeType: "application/json",
  },
};
