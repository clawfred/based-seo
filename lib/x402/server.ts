/**
 * The x402 resource server.
 *
 * One wildcard route covers all 351 public endpoints. x402 compiles its routes
 * once at construction and offers no runtime registration, so a literal entry
 * per endpoint is impossible anyway — but it is also unnecessary: `price` may be
 * a `DynamicPrice` function, and `ctx.adapter` exposes the path and body. The
 * price is therefore resolved from the registry per request.
 */

import { facilitator as cdpFacilitator } from "@coinbase/x402";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import type { HTTPRequestContext, RoutesConfig } from "@x402/core/server";
import { x402HTTPResourceServer } from "@x402/core/http";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

import { quoteFor, segmentsFromPath } from "@/lib/billing/quote";
import { productSlugFromPath, quoteProduct } from "@/lib/products/quote";
import { API_PREFIX, PRODUCT_PREFIX } from "./constants";
import { getNetworkConfig, getPayToAddress } from "./network";

/**
 * Built lazily so a missing env var surfaces as a request-time 500 with a clear
 * message rather than a module-load crash that takes down unrelated routes.
 */
let cached: x402HTTPResourceServer | undefined;
let initPromise: Promise<void> | undefined;

function buildRoutes(): RoutesConfig {
  const net = getNetworkConfig();
  const payTo = getPayToAddress();

  return {
    [`POST ${API_PREFIX}/*`]: {
      accepts: {
        scheme: "exact",
        network: net.caip2,
        payTo,
        // Resolved per request from the registry, reading the body so a batch of
        // N tasks is priced at N x the unit price before the 402 is issued. The
        // route validates and 4xxs bad input before x402 is ever invoked, so by
        // the time this runs the body is known-good and quoteFor cannot throw.
        price: async (ctx: HTTPRequestContext) => {
          const body = await (ctx.adapter as { getBody: () => Promise<unknown> }).getBody();
          return quoteFor(segmentsFromPath(ctx.path), body).formatted;
        },
        maxTimeoutSeconds: 600,
      },
      description: "DataForSEO SEO & GEO data, priced per request",
      mimeType: "application/json",
    },

    // Composite products fan out to several upstream endpoints behind one
    // charge; their price is the sum of the components, never a hardcoded
    // bundle figure that could drift under the cost of its own parts.
    [`POST ${PRODUCT_PREFIX}/*`]: {
      accepts: {
        scheme: "exact",
        network: net.caip2,
        payTo,
        price: async (ctx: HTTPRequestContext) => {
          const body = await (ctx.adapter as { getBody: () => Promise<unknown> }).getBody();
          return quoteProduct(productSlugFromPath(ctx.path), body).formatted;
        },
        maxTimeoutSeconds: 600,
      },
      description: "Bundled SEO products",
      mimeType: "application/json",
    },
  };
}

function build(): x402HTTPResourceServer {
  const net = getNetworkConfig();
  // Mainnet settles through CDP, whose /verify and /settle require signed auth
  // headers; `cdpFacilitator` is already a FacilitatorConfig carrying them.
  // Base Sepolia uses the public facilitator, which needs no credentials.
  const facilitator = new HTTPFacilitatorClient(
    net.requiresCdpAuth ? cdpFacilitator : { url: net.facilitatorUrl },
  );

  const resourceServer = new x402ResourceServer(facilitator);
  registerExactEvmScheme(resourceServer);
  return new x402HTTPResourceServer(resourceServer, buildRoutes());
}

export function getX402Server(): x402HTTPResourceServer {
  if (!cached) cached = build();
  return cached;
}

/**
 * Fetch the facilitator's supported schemes once.
 *
 * A rejected promise is NOT cached. The previous implementation memoised the
 * init promise unconditionally, so a single bad facilitator response during a
 * cold start left every subsequent payment returning 500 until the process was
 * replaced. Failures clear the memo so the next request retries.
 */
export async function initX402Once(): Promise<void> {
  if (initPromise) return initPromise;

  const attempt = getX402Server()
    .initialize()
    .catch((err) => {
      initPromise = undefined;
      cached = undefined;
      throw err;
    });

  initPromise = attempt;
  return attempt;
}

/** Test seam. */
export function __resetX402Server(): void {
  cached = undefined;
  initPromise = undefined;
}
