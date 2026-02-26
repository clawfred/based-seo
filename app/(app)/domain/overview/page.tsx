"use client";

import { useEffect, useRef } from "react";
import { Globe, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locations } from "@/lib/locations";
import { AlertBanner } from "@/components/shared/alert-banner";
import { useDomainOverview } from "@/hooks/use-domain-overview";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePreferences } from "@/hooks/use-preferences";
import { DomainMetricsCards } from "@/components/domain/overview/domain-metrics-cards";
import { DomainTrafficChart } from "@/components/domain/overview/domain-traffic-chart";
import { TopKeywordsTable } from "@/components/domain/overview/top-keywords-table";

const exampleDomains = ["ahrefs.com", "semrush.com", "moz.com", "hubspot.com"];

export default function DomainOverviewPage() {
  const { domain, setDomain, location, setLocation, search, loading, warning, error, data, reset } =
    useDomainOverview();
  const { userId } = useCurrentUser();
  const { preferences, updatePreferences } = usePreferences(userId);

  // Apply saved default location on first load
  const appliedDefault = useRef(false);
  useEffect(() => {
    if (!appliedDefault.current && preferences.defaultLocation && !data) {
      setLocation(preferences.defaultLocation);
      appliedDefault.current = true;
    }
  }, [preferences.defaultLocation, data, setLocation]);

  // Save location preference when user changes it
  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    updatePreferences({ defaultLocation: newLoc });
  };

  function handleSearch() {
    if (domain.trim()) {
      search(domain.trim());
    }
  }

  function handleExampleClick(exampleDomain: string) {
    setDomain(exampleDomain);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && domain.trim()) {
      handleSearch();
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      {/* Hero search section */}
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Domain Overview</h1>
          <p className="mt-2 text-muted-foreground">
            Analyze any domain&apos;s SEO performance, traffic, and keywords
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter domain (e.g., competitor.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1"
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <Select value={location} onValueChange={handleLocationChange}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.code} value={loc.code}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearch}
                  className="gap-2"
                  disabled={loading || !domain.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  Analyze
                </Button>
              </div>
              <p className={`text-xs text-muted-foreground ${!domain.trim() ? "invisible" : ""}`}>
                Cost: $0.03 USDC
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleDomains.map((exampleDomain) => (
                <Badge
                  key={exampleDomain}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleExampleClick(exampleDomain)}
                >
                  {exampleDomain}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {warning && (
        <div className="mx-auto max-w-3xl">
          <AlertBanner variant="warning" message={warning} />
        </div>
      )}

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
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Results */}
      {!loading && data && (
        <>
          {/* Domain header */}
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{data.domain}</h2>
            <a
              href={`https://${data.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {data && (
              <Button variant="outline" size="sm" onClick={reset}>
                New search
              </Button>
            )}
          </div>

          {/* Metrics cards */}
          <DomainMetricsCards data={data} />

          {/* Charts and tables */}
          <div className="grid gap-4 lg:grid-cols-2">
            {data.trafficHistory && data.trafficHistory.length > 0 && (
              <DomainTrafficChart trafficHistory={data.trafficHistory} />
            )}
            {data.topKeywords && data.topKeywords.length > 0 && (
              <TopKeywordsTable keywords={data.topKeywords} domain={data.domain} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
