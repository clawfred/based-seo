/**
 * Composite products.
 *
 * `/api/v3/*` is a 1:1 passthrough, which is what an agent wants. The dashboard
 * wants a keyword overview to mean "volume, ideas, and who ranks" — three
 * DataForSEO calls behind one price and one payment.
 *
 * A product is defined by the registry endpoints it fans out to, so its price is
 * derived rather than declared. Hardcoding a bundle price is how you end up
 * selling $0.04 of upstream calls for $0.03.
 */

import { getBySlug, type EndpointDef } from "@/lib/registry";
import { quote } from "@/lib/registry/pricing";

export interface ProductDef {
  readonly id: string;
  /** Mount path, under /api/products/. */
  readonly slug: string;
  readonly description: string;
  /** Registry slugs this product fans out to. */
  readonly components: readonly string[];
}

export const PRODUCTS: readonly ProductDef[] = [
  {
    id: "keyword_overview",
    slug: "keyword-overview",
    description:
      "Search volume, difficulty, CPC, keyword ideas, and the live SERP for one keyword.",
    components: [
      "dataforseo_labs/google/keyword_overview/live",
      "dataforseo_labs/google/keyword_ideas/live",
      "serp/google/organic/live/regular",
    ],
  },
  {
    id: "keyword_ideas",
    slug: "keyword-ideas",
    description: "Related keywords, questions, and content ideas from one seed keyword.",
    components: ["dataforseo_labs/google/keyword_ideas/live"],
  },
  {
    id: "serp_analysis",
    slug: "serp-analysis",
    description: "The top organic results for a query, with ranking domains.",
    components: ["serp/google/organic/live/regular"],
  },
] as const;

const BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string): ProductDef | undefined {
  return BY_SLUG.get(slug);
}

/**
 * The registry endpoints a product fans out to.
 * Throws at module boundary if a component slug is wrong — a typo here would
 * otherwise surface as a silent under-charge.
 */
export function componentsOf(product: ProductDef): EndpointDef[] {
  return product.components.map((slug) => {
    const endpoint = getBySlug(slug);
    if (!endpoint) {
      throw new Error(`Product "${product.id}" references unknown endpoint "${slug}"`);
    }
    return endpoint;
  });
}

/** Sum of the component prices, in micro-USD. */
export function priceMicros(product: ProductDef, taskCount = 1): number {
  return componentsOf(product).reduce((sum, e) => sum + quote(e).micros * taskCount, 0);
}
