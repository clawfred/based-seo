/**
 * GET /api/v3/manifest
 *
 * The based-seo API manifest: a JSON index of every PUBLIC endpoint with its
 * slug, method, group, description, price (usd + formatted + confidence),
 * required/optional params, and the x402 payment info. This is our own format;
 * see `lib/discovery/types.ts` for the shape and `buildManifest` for how it is
 * derived from the endpoint registry.
 *
 * Internal task-retrieval endpoints are excluded at the source and never
 * appear here. Generation is memoized in module scope, so this handler only
 * serves a cached string.
 */

import { getManifestJson } from "@/lib/discovery/cache";

// Render at runtime so payment env (X402_NETWORK / EVM_ADDRESS) is read from the
// live process, not baked at build. The body itself is memoized in module scope.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return new Response(getManifestJson(), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
