"use client";

import { useCallback, useEffect, useState } from "react";

interface ManifestEndpoint {
  slug: string;
  price?: { usd?: number; formatted?: string };
}

export interface EndpointPrice {
  usd: number;
  formatted: string;
}

export interface ManifestPrices {
  /** Look up one endpoint's live price, or undefined until the manifest loads. */
  priceOf: (slug: string) => EndpointPrice | undefined;
  /** Combined USD cost of a set of slugs. */
  totalOf: (slugs: string[]) => number;
  loading: boolean;
}

/**
 * Reads live per-endpoint prices from `/api/v3/manifest` so the GEO UI never
 * hardcodes an amount that could drift from what the gateway charges. One fetch
 * per mount; the manifest is cached server-side.
 */
export function useManifestPrices(): ManifestPrices {
  const [bySlug, setBySlug] = useState<Record<string, EndpointPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/v3/manifest");
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        const manifest = (await res.json()) as { endpoints?: ManifestEndpoint[] };

        const map: Record<string, EndpointPrice> = {};
        for (const ep of manifest.endpoints ?? []) {
          map[ep.slug] = { usd: ep.price?.usd ?? 0, formatted: ep.price?.formatted ?? "" };
        }
        if (!cancelled) setBySlug(map);
      } catch {
        // Prices are informational; a failed manifest fetch just hides them.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const priceOf = useCallback((slug: string) => bySlug[slug], [bySlug]);
  const totalOf = useCallback(
    (slugs: string[]) => slugs.reduce((sum, slug) => sum + (bySlug[slug]?.usd ?? 0), 0),
    [bySlug],
  );

  return { priceOf, totalOf, loading };
}
