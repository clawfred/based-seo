/**
 * Build the based-seo API manifest — our own machine-readable index of every
 * public endpoint, its price, and how to pay for it via x402.
 *
 * This is a bespoke format (not OpenAPI, not the x402 Bazaar schema); the
 * `/api/v3/manifest` route documents it. Internal task-retrieval endpoints are
 * excluded at the source via `listPublic()` and must never appear here.
 */

import { listGroups, listPublic } from "@/lib/registry";
import type { EndpointDef } from "@/lib/registry";
import { quote } from "@/lib/registry/pricing";
import { paramTypesFor } from "./params";
import { resolveX402Info } from "./x402-info";
import type { Manifest, ManifestEndpoint, ManifestPrice } from "./types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://based-seo.com";

const ESTIMATED_DISCLOSURE =
  "DataForSEO publishes no price for this endpoint; the amount is the maximum " +
  "published price in its API group, so we never undercharge relative to upstream cost.";

const PRICE_CONFIDENCE_NOTE =
  "price.confidence is 'published' when DataForSEO lists an exact price, or " +
  "'estimated' when we substitute the group's maximum published price. Estimated " +
  "prices carry a price.disclosure string.";

function priceFor(endpoint: EndpointDef): ManifestPrice {
  const q = quote(endpoint);
  const base: ManifestPrice = {
    usd: q.usd,
    formatted: q.formatted,
    micros: q.micros,
    confidence: q.confidence,
  };
  return q.confidence === "estimated" ? { ...base, disclosure: ESTIMATED_DISCLOSURE } : base;
}

function toManifestEndpoint(endpoint: EndpointDef): ManifestEndpoint {
  return {
    slug: endpoint.slug,
    path: `/api/v3/${endpoint.slug}`,
    method: endpoint.method,
    mode: endpoint.mode,
    group: endpoint.group,
    description: endpoint.description,
    billable: endpoint.billable,
    price: priceFor(endpoint),
    required: endpoint.required,
    optional: endpoint.optional,
    paramTypes: paramTypesFor(endpoint),
  };
}

export function buildManifest(): Manifest {
  const endpoints = listPublic()
    .map(toManifestEndpoint)
    .sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    name: "based-seo DataForSEO Gateway",
    description:
      "Pay-per-call access to DataForSEO's SEO/GEO endpoints. No account: agents " +
      "pay per request in USDC via x402 on Base. Discovery is public; only " +
      "execution requires payment.",
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    docs: {
      manifest: `${SITE}/api/v3/manifest`,
      openapi: `${SITE}/openapi.json`,
      llmsTxt: `${SITE}/llms.txt`,
      homepage: SITE,
    },
    payment: resolveX402Info(),
    priceConfidenceNote: PRICE_CONFIDENCE_NOTE,
    endpointCount: endpoints.length,
    groups: listGroups().filter((g) => endpoints.some((e) => e.group === g)),
    endpoints,
  };
}
