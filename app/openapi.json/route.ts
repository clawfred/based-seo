/**
 * GET /openapi.json
 *
 * OpenAPI 3.1 description of the public API, generated from the endpoint
 * registry. Served at the site root (`/openapi.json`) — the conventional,
 * tooling-discoverable location that Swagger UI, codegen, and llms.txt link to,
 * rather than nesting it under /api. Each operation carries x-price-usd /
 * x-price-confidence and documents the x402 402 handshake.
 *
 * The document is memoized in module scope; this handler serves a cached string.
 */

import { getOpenApiJson } from "@/lib/discovery/cache";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(getOpenApiJson(), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
