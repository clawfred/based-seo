"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { AlertBanner } from "@/components/shared/alert-banner";
import { DomainSearch } from "@/components/domain/domain-search";
import { DomainResults } from "@/components/domain/domain-results";
import { DomainEmptyState } from "@/components/domain/domain-empty-state";
import { DomainSkeleton } from "@/components/domain/domain-skeleton";
import { DomainPaywall } from "@/components/domain/domain-paywall";
import { useDomainPrices } from "@/hooks/use-domain-prices";
import { useDomainReport } from "@/hooks/use-domain-report";

export default function DomainPage() {
  const [target, setTarget] = useState("");

  const { authenticated } = usePrivy();
  const { login } = useLogin();

  const prices = useDomainPrices();
  const { status, report, error, run, hasWallet } = useDomainReport();

  // The Analyze button and the paywall's "pay & run" both funnel through here;
  // the connected wallet (if any) settles payment inside the endpoint runner.
  const runReport = () => run(target);

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Domain Overview</h1>
        <p className="text-muted-foreground">
          A one-stop snapshot of any domain — its keyword footprint, backlink authority, and
          technology stack.
        </p>
      </div>

      <DomainSearch
        value={target}
        onChange={setTarget}
        onSubmit={runReport}
        loading={status === "loading"}
        totalUsd={prices.totalUsd}
        pricesLoading={prices.loading}
      />

      {status === "loading" && <DomainSkeleton />}

      {status === "paywall" && (
        <DomainPaywall
          target={target}
          totalUsd={prices.totalUsd}
          authenticated={authenticated}
          hasWallet={hasWallet}
          loading={false}
          onConnect={login}
          onPay={runReport}
        />
      )}

      {status === "error" && error && <AlertBanner variant="error" message={error} />}

      {status === "success" && report && <DomainResults report={report} />}

      {status === "idle" && <DomainEmptyState />}
    </div>
  );
}
