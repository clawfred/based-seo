"use client";

import { useState } from "react";
import { Search, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AlertBanner } from "@/components/shared/alert-banner";
import { BacklinksMetrics, BacklinksMetricsData } from "@/components/backlinks/backlinks-metrics";
import { AnchorDistributionChart, AnchorData } from "@/components/backlinks/anchor-distribution-chart";
import { ReferringDomainsBreakdown } from "@/components/backlinks/referring-domains-breakdown";

const exampleDomains = ["github.com", "vercel.com", "cloudflare.com", "stripe.com"];

interface BacklinksData extends BacklinksMetricsData {
  domain: string;
  topAnchors: AnchorData[];
  referringDomainsBreakdown: Record<string, number>;
}

export default function BacklinksPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BacklinksData | null>(null);

  async function handleSearch(searchDomain?: string) {
    const domainToSearch = searchDomain || domain.trim();
    
    if (!domainToSearch) return;
    
    // Clean the domain input
    const cleanDomain = domainToSearch
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .split("/")[0];

    setLoading(true);
    setError(null);
    setWarning(null);
    setData(null);

    try {
      const response = await fetch("/api/backlinks/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to fetch backlinks data");
        return;
      }

      if (result.warning) {
        setWarning(result.warning);
      }

      setData(result.data);
    } catch (err) {
      console.error("Backlinks fetch error:", err);
      setError("Failed to fetch backlinks data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleExampleClick(exampleDomain: string) {
    setDomain(exampleDomain);
    // Do not auto-search, user must click Search button
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      {/* Hero search section */}
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Backlinks Summary</h1>
          <p className="mt-2 text-muted-foreground">
            Analyze any domain&apos;s backlink profile and authority
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter a domain (e.g., example.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                className="gap-2"
                disabled={loading || !domain.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Analyze
              </Button>
            </div>

            <p className={`text-xs text-muted-foreground ${!domain.trim() ? "invisible" : ""}`}>
              Cost: $0.05 USDC
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleDomains.map((d) => (
                <Badge
                  key={d}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleExampleClick(d)}
                >
                  {d}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning banner */}
      {warning && (
        <div className="mx-auto max-w-3xl">
          <AlertBanner variant="warning" message={warning} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-auto max-w-3xl">
          <AlertBanner variant="error" message={error} />
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-56 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Results */}
      {!loading && data && (
        <>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{data.domain}</h2>
          </div>

          <BacklinksMetrics
            data={{
              totalBacklinks: data.totalBacklinks,
              referringDomains: data.referringDomains,
              domainRank: data.domainRank,
              dofollowRatio: data.dofollowRatio,
              newLinks30d: data.newLinks30d,
              lostLinks30d: data.lostLinks30d,
            }}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <AnchorDistributionChart anchors={data.topAnchors} />
            <ReferringDomainsBreakdown breakdown={data.referringDomainsBreakdown} />
          </div>
        </>
      )}
    </div>
  );
}
