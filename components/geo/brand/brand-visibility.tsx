"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useWalletClient } from "wagmi";

import { AlertBanner } from "@/components/shared/alert-banner";
import { GeoEmptyState } from "@/components/geo/geo-empty-state";
import { GeoPaywall } from "@/components/geo/geo-paywall";
import { BrandSearch } from "./brand-search";
import { BrandResults } from "./brand-results";
import { BrandSkeleton } from "./brand-skeleton";
import { BRAND_SLUGS } from "./brand-slugs";
import { useBrandVisibility } from "@/hooks/use-brand-visibility";
import { useManifestPrices } from "@/hooks/use-manifest-prices";

/**
 * Brand Visibility screen: how often AI engines mention a brand, who out-ranks
 * it for a topic, and the mentions it's gaining or losing over time.
 */
export function BrandVisibility() {
  const [brand, setBrand] = useState("");
  const [keyword, setKeyword] = useState("");

  const { authenticated } = usePrivy();
  const { login } = useLogin();
  const { data: walletClient } = useWalletClient();

  const { priceOf, totalOf, loading: pricesLoading } = useManifestPrices();
  const { status, data, error, run } = useBrandVisibility();

  // The leaderboard call only fires with a topic keyword, so its price only
  // counts toward the total when one is entered.
  const slugs: string[] = [BRAND_SLUGS.targetMetrics, BRAND_SLUGS.timeseries];
  if (keyword.trim()) slugs.push(BRAND_SLUGS.topBrands);
  const totalUsd = totalOf(slugs);

  const runQuery = () => run(brand, keyword, walletClient ?? undefined);

  return (
    <div className="space-y-6">
      <BrandSearch
        brand={brand}
        keyword={keyword}
        onBrandChange={setBrand}
        onKeywordChange={setKeyword}
        onSubmit={runQuery}
        loading={status === "loading"}
        totalUsd={totalUsd}
        pricesLoading={pricesLoading}
      />

      {status === "loading" && <BrandSkeleton />}

      {status === "paywall" && (
        <GeoPaywall
          subject={`AI-visibility data for ${data?.target ?? brand}`}
          totalUsd={totalUsd || (priceOf(BRAND_SLUGS.targetMetrics)?.usd ?? 0)}
          authenticated={authenticated}
          hasWallet={Boolean(walletClient)}
          loading={false}
          onConnect={login}
          onPay={runQuery}
        />
      )}

      {status === "error" && error && <AlertBanner variant="error" message={error} />}

      {status === "success" && data && <BrandResults data={data} />}

      {status === "idle" && <GeoEmptyState />}
    </div>
  );
}
