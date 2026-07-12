/**
 * GET /llms.txt
 *
 * Plain-text signpost following the llms.txt convention (https://llmstxt.org):
 * what this API is, how to pay via x402, and links to the manifest + OpenAPI.
 * Lists the endpoint GROUPS, not all 351 endpoints. Memoized in module scope.
 */

import { getLlmsTxt } from "@/lib/discovery/cache";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(getLlmsTxt(), {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
