"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useWalletClient } from "wagmi";
import { AlertBanner } from "@/components/shared/alert-banner";
import { BacklinksSearch } from "@/components/backlinks/backlinks-search";
import { BacklinksResults } from "@/components/backlinks/backlinks-results";
import { BacklinksEmptyState } from "@/components/backlinks/backlinks-empty-state";
import { BacklinksSkeleton } from "@/components/backlinks/backlinks-skeleton";
import { BacklinksPaywall } from "@/components/backlinks/backlinks-paywall";
import { useBacklinkPrices } from "@/hooks/use-backlink-prices";
import { useBacklinksQuery } from "@/hooks/use-backlinks-query";

export default function BacklinksPage() {
  const [target, setTarget] = useState("");

  const { authenticated } = usePrivy();
  const { login } = useLogin();
  const { data: walletClient } = useWalletClient();

  const prices = useBacklinkPrices();
  const { status, data, error, run } = useBacklinksQuery();

  // The search button and the paywall's "pay & run" both funnel through here,
  // passing whatever wallet is connected so x402Fetch can settle payment.
  const runQuery = () => run(target, walletClient ?? undefined);

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Site Explorer</h1>
        <p className="text-muted-foreground">
          Inspect any site's backlink profile — referring domains, individual links, and authority.
        </p>
      </div>

      <BacklinksSearch
        value={target}
        onChange={setTarget}
        onSubmit={runQuery}
        loading={status === "loading"}
        totalUsd={prices.totalUsd}
        pricesLoading={prices.loading}
      />

      {status === "loading" && <BacklinksSkeleton />}

      {status === "paywall" && (
        <BacklinksPaywall
          target={data?.target ?? target}
          totalUsd={prices.totalUsd}
          authenticated={authenticated}
          hasWallet={Boolean(walletClient)}
          loading={false}
          onConnect={login}
          onPay={runQuery}
        />
      )}

      {status === "error" && error && <AlertBanner variant="error" message={error} />}

      {status === "success" && data && <BacklinksResults data={data} />}

      {status === "idle" && <BacklinksEmptyState />}
    </div>
  );
}
