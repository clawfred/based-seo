"use client";

import { useEffect, useState } from "react";
import { ALL_DOMAIN_SLUGS } from "@/components/domain/constants";

interface ManifestEndpoint {
  slug: string;
  price?: { usd?: number; formatted?: string };
}

export interface DomainPrices {
  /** Formatted price per slug, e.g. `"$0.02"`. Empty until the manifest loads. */
  bySlug: Record<string, string>;
  /** Combined USD cost of one full report across all five endpoints. */
  totalUsd: number;
  loading: boolean;
}

/**
 * Reads live prices from `/api/v3/manifest` so the UI never hardcodes an amount
 * that could drift from what the gateway actually charges. One fetch per mount.
 * Mirrors `use-backlink-prices`, scoped to the domain report's slugs.
 */
export function useDomainPrices(): DomainPrices {
  const [bySlug, setBySlug] = useState<Record<string, string>>({});
  const [totalUsd, setTotalUsd] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/v3/manifest");
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        const manifest = (await res.json()) as { endpoints?: ManifestEndpoint[] };
        const wanted = new Set<string>(ALL_DOMAIN_SLUGS);

        const formatted: Record<string, string> = {};
        let sum = 0;
        for (const ep of manifest.endpoints ?? []) {
          if (!wanted.has(ep.slug)) continue;
          formatted[ep.slug] = ep.price?.formatted ?? "";
          sum += ep.price?.usd ?? 0;
        }

        if (!cancelled) {
          setBySlug(formatted);
          setTotalUsd(sum);
        }
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

  return { bySlug, totalUsd, loading };
}
