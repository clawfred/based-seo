"use client";

import { useState } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useWalletClient } from "wagmi";

import { AlertBanner } from "@/components/shared/alert-banner";
import { AuditSearch } from "@/components/site-audit/audit-search";
import { AuditEmptyState } from "@/components/site-audit/audit-empty-state";
import { AuditPaywall } from "@/components/site-audit/audit-paywall";
import { AuditCrawling } from "@/components/site-audit/audit-crawling";
import { AuditResults } from "@/components/site-audit/audit-results";
import { DEFAULT_CRAWL_PAGES } from "@/components/site-audit/constants";
import { useSiteAudit } from "@/hooks/use-site-audit";
import { useAuditPrice } from "@/hooks/use-audit-price";

export default function SiteAuditPage() {
  const [target, setTarget] = useState("");
  const [pages, setPages] = useState<number>(DEFAULT_CRAWL_PAGES);

  const { authenticated } = usePrivy();
  const { login } = useLogin();
  const { data: walletClient } = useWalletClient();

  const price = useAuditPrice();
  const audit = useSiteAudit();

  // Both the search button and the paywall's "pay & crawl" funnel through here,
  // passing whatever wallet is connected so x402Fetch can settle payment.
  const runAudit = () => audit.run(target, pages, walletClient ?? undefined);

  const busy = audit.status === "paying" || audit.status === "crawling";

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Site Audit</h1>
        <p className="text-muted-foreground">
          Crawl any website and surface its technical SEO issues - broken links, duplicate tags,
          missing metadata, slow pages, and more.
        </p>
      </div>

      <AuditSearch
        value={target}
        onChange={setTarget}
        pages={pages}
        onPagesChange={setPages}
        onSubmit={runAudit}
        loading={busy}
        estimateUsd={price.estimateFor(pages)}
        priceLoading={price.loading}
      />

      {busy && (
        <AuditCrawling target={audit.target} summary={audit.summary} pollCount={audit.pollCount} />
      )}

      {audit.status === "paywall" && (
        <AuditPaywall
          target={audit.target || target}
          pages={pages}
          estimateUsd={price.estimateFor(pages)}
          authenticated={authenticated}
          hasWallet={Boolean(walletClient)}
          loading={false}
          onConnect={login}
          onPay={runAudit}
        />
      )}

      {audit.status === "error" && audit.error && (
        <AlertBanner variant="error" message={audit.error} />
      )}

      {audit.status === "ready" && audit.data && <AuditResults data={audit.data} />}

      {audit.status === "idle" && <AuditEmptyState />}
    </div>
  );
}
