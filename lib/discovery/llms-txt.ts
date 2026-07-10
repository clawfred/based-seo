/**
 * Build the /llms.txt signpost (https://llmstxt.org).
 *
 * A concise Markdown file that tells an LLM what this API is, how to pay via
 * x402, and where the machine-readable index lives. It lists the endpoint
 * GROUPS (13), not all 351 endpoints — the manifest is the full catalog.
 */

import { getByGroup, listGroups, listPublic } from "@/lib/registry";
import { resolveX402Info } from "./x402-info";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://based-seo.com";

export function buildLlmsTxt(): string {
  const pay = resolveX402Info();
  const publicCount = listPublic().length;
  const network = pay.network ?? "base or base-sepolia (set via X402_NETWORK)";

  const groupLines = listGroups()
    .map((group) => {
      const count = getByGroup(group).filter((e) => e.exposure === "public").length;
      return count > 0 ? `- ${group}: ${count} endpoints` : null;
    })
    .filter((line): line is string => line !== null);

  return `# based-seo DataForSEO Gateway

> Pay-per-call access to ${publicCount} DataForSEO SEO/GEO endpoints. Agents pay per request in USDC via x402 on Base — no account, no API key. Discovery is public; only execution is paid.

## How to pay (x402)

- Protocol: x402 v2, scheme "exact", asset USDC, network ${network}.
- Send your request to \`POST /api/v3/{slug}\`. If payment is required you get HTTP 402 with a \`PAYMENT-REQUIRED\` header describing the amount and payTo.
- Retry the same request with a \`PAYMENT-SIGNATURE\` header (an EIP-3009 USDC authorization). On success the response carries \`PAYMENT-RESPONSE\`.
- Per-endpoint prices are published in the manifest and OpenAPI (\`x-price-usd\`). Some prices are marked \`estimated\` and disclosed as such.

## Machine-readable index

- [API manifest](${SITE}/api/v3/manifest): every public endpoint with slug, method, price, and params (JSON).
- [OpenAPI 3.1](${SITE}/openapi.json): full schema for humans and codegen, with x-price extensions.

## Endpoint groups

${groupLines.join("\n")}

## Notes

- The manifest is the source of truth for the full endpoint list and pricing.
- Internal task-retrieval endpoints are not exposed and never appear in any index.
`;
}
