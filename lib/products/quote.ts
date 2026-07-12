/**
 * Pricing for composite products, mirroring `lib/billing/quote.ts` but summing
 * over the registry endpoints a product fans out to.
 *
 * A batch is priced from the keyword array in the body, not from a client-supplied
 * count header. The old batch endpoint took `x-keyword-count` on trust to compute
 * its price; deriving the count from the payload we are about to forward makes the
 * quote and the work structurally impossible to disagree.
 */

import type { Chargeable } from "@/lib/billing/charge";
import { QuoteError } from "@/lib/billing/quote";
import { formatMicros, microsToUsd } from "@/lib/registry/pricing";
import { PRODUCT_PREFIX } from "@/lib/x402/constants";
import { componentsOf, getProduct, priceMicros, type ProductDef } from "./index";

/** DataForSEO's live endpoints take one task per request, so we fan out serially-ish. */
const MAX_BATCH_KEYWORDS = 25;
const MAX_KEYWORD_LENGTH = 700;

export interface ProductQuote extends Chargeable {
  readonly product: ProductDef;
  readonly usd: number;
  /** Always at least one. A single-keyword request is a batch of one. */
  readonly keywords: readonly string[];
  readonly locationCode: number;
  readonly languageCode: string;
}

/** Path segments after `/api/products/`. */
export function productSlugFromPath(path: string): string {
  const rest = path.startsWith(PRODUCT_PREFIX) ? path.slice(PRODUCT_PREFIX.length) : path;
  return rest.split("/").filter(Boolean)[0] ?? "";
}

function parseKeywords(input: Record<string, unknown>): string[] {
  const { keyword, keywords } = input;

  if (Array.isArray(keywords)) {
    if (keywords.length === 0) throw new QuoteError("`keywords` must not be empty", 400);
    if (keywords.length > MAX_BATCH_KEYWORDS) {
      throw new QuoteError(`At most ${MAX_BATCH_KEYWORDS} keywords per request`, 400);
    }
    return keywords.map((k, i) => {
      if (typeof k !== "string" || !k.trim()) {
        throw new QuoteError(`keywords[${i}] must be a non-empty string`, 400);
      }
      if (k.length > MAX_KEYWORD_LENGTH) {
        throw new QuoteError(`keywords[${i}] exceeds ${MAX_KEYWORD_LENGTH} characters`, 400);
      }
      return k.trim();
    });
  }

  if (typeof keyword === "string" && keyword.trim()) {
    if (keyword.length > MAX_KEYWORD_LENGTH) {
      throw new QuoteError(`\`keyword\` exceeds ${MAX_KEYWORD_LENGTH} characters`, 400);
    }
    return [keyword.trim()];
  }

  throw new QuoteError("Provide `keyword` (string) or `keywords` (array of strings)", 400);
}

export function quoteProduct(slug: string, body: unknown): ProductQuote {
  const product = getProduct(slug);
  if (!product) throw new QuoteError(`No product at /${slug}`, 404);

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new QuoteError("Request body must be a JSON object", 400);
  }
  const input = body as Record<string, unknown>;

  const keywords = parseKeywords(input);
  const locationCode = typeof input.location_code === "number" ? input.location_code : 2840;
  const languageCode = typeof input.language_code === "string" ? input.language_code : "en";

  // Throws if a component slug is wrong, before any money moves.
  componentsOf(product);

  // Price scales with the keywords we will actually forward.
  const micros = priceMicros(product, keywords.length);

  return {
    product,
    slug: product.slug,
    billable: micros > 0,
    isTaskPost: false,
    micros,
    usd: microsToUsd(micros),
    formatted: formatMicros(micros),
    keywords,
    locationCode,
    languageCode,
    body: { keywords, location_code: locationCode, language_code: languageCode },
  };
}
