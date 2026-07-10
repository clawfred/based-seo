/**
 * Shared shapes for the agent-facing discovery surface (manifest, OpenAPI,
 * llms.txt). Everything here is derived from the endpoint registry; nothing is
 * hand-maintained per endpoint.
 */

import type { X402Network } from "@/lib/x402/network";

/**
 * x402 payment metadata advertised to agents. Resolved from env once per
 * process. Discovery is public and must render even when the payment env is
 * unset (e.g. CI), so every money field is nullable and `configured` says
 * whether callers can trust `payTo`/`network`.
 */
export interface X402PaymentInfo {
  readonly protocol: "x402";
  /** Wire version. v2 is what the CDP Bazaar indexes. */
  readonly version: 2;
  readonly scheme: "exact";
  /** True only when X402_NETWORK and EVM_ADDRESS resolved cleanly. */
  readonly configured: boolean;
  readonly network: X402Network | null;
  /** CAIP-2 chain id, e.g. `eip155:8453`. */
  readonly caip2: string | null;
  readonly chainId: number | null;
  readonly asset: {
    readonly symbol: "USDC";
    readonly address: string | null;
    readonly decimals: 6;
  };
  readonly payTo: string | null;
  readonly facilitator: string | null;
  readonly isMainnet: boolean | null;
  /**
   * x402 v2 header names. `paymentRequired` is on the 402; the caller retries
   * with `paymentSignature`; a settled response carries `paymentResponse`.
   */
  readonly headers: {
    readonly paymentRequired: "PAYMENT-REQUIRED";
    readonly paymentSignature: "PAYMENT-SIGNATURE";
    readonly paymentResponse: "PAYMENT-RESPONSE";
  };
  /** Present only when unconfigured, explaining what an agent should expect. */
  readonly note?: string;
}

/** Price block echoed into the manifest. Never hand-format `formatted`. */
export interface ManifestPrice {
  readonly usd: number;
  /** x402-safe rendering; keeps sub-cent precision (`"$0.0006"`). */
  readonly formatted: string;
  /** Integer micro-USD; the authoritative amount. */
  readonly micros: number;
  readonly confidence: "published" | "estimated";
  /** Disclosure string, present iff confidence is `estimated`. */
  readonly disclosure?: string;
}

export interface ManifestEndpoint {
  readonly slug: string;
  /** Where an agent POSTs/GETs this endpoint on our gateway. */
  readonly path: string;
  readonly method: "POST" | "GET";
  readonly mode: string;
  readonly group: string;
  readonly description: string;
  readonly billable: boolean;
  readonly price: ManifestPrice;
  /**
   * Required body params. A `"a|b"` token means "supply at least one of a, b"
   * (DataForSEO accepts either a name or a code for locations/languages).
   */
  readonly required: readonly string[];
  readonly optional: readonly string[];
  /** JSON-Schema-ish type per param name, for the params referenced above. */
  readonly paramTypes: Readonly<Record<string, string>>;
}

export interface Manifest {
  readonly name: string;
  readonly description: string;
  readonly manifestVersion: 1;
  readonly generatedAt: string;
  readonly docs: {
    readonly manifest: string;
    readonly openapi: string;
    readonly llmsTxt: string;
    readonly homepage: string;
  };
  readonly payment: X402PaymentInfo;
  readonly priceConfidenceNote: string;
  readonly endpointCount: number;
  readonly groups: readonly string[];
  readonly endpoints: readonly ManifestEndpoint[];
}
