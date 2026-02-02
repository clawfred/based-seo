"use client";

import { useEffect, useRef } from "react";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locations } from "@/lib/locations";
import { AlertBanner } from "@/components/shared/alert-banner";
import { KeywordChipInput } from "@/components/shared/keyword-chip-input";
import { useKeywordOverview } from "@/hooks/use-keyword-overview";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePreferences } from "@/hooks/use-preferences";
import { recordSearch } from "@/lib/search-history-api";
import { getLocationByCode } from "@/lib/locations";
import { OverviewResultsTable } from "@/components/keywords/overview/overview-results-table";
import { OverviewMetrics } from "@/components/keywords/overview/overview-metrics";
import { SerpTable } from "@/components/keywords/overview/serp-table";
import { KeywordIdeasSection } from "@/components/keywords/overview/keyword-ideas-section";
import { VolumeBreakdown } from "@/components/keywords/overview/volume-breakdown";
import { TrendChart } from "@/components/keywords/overview/trend-chart";

const exampleKeywords = ["seo tools", "keyword research", "backlink checker", "rank tracker"];

export default function KeywordOverviewPage() {
  const {
    chips,
    setChips,
    inputValue,
    setInputValue,
    location,
    setLocation,
    search,
    loading,
    warning,
    results,
    getDetail,
    errors,
    activeKeyword,
    setActiveKeyword,
  } = useKeywordOverview();
  const { userId } = useCurrentUser();
  const { preferences, updatePreferences } = usePreferences(userId);

  // Apply saved default location on first load
  const appliedDefault = useRef(false);
  useEffect(() => {
    if (!appliedDefault.current && preferences.defaultLocation && chips.length === 0) {
      setLocation(preferences.defaultLocation);
      appliedDefault.current = true;
    }
  }, [preferences.defaultLocation, chips.length, setLocation]);

  const locationName = locations.find((l) => l.code === location)?.name ?? location;

  // Save location preference when user changes it
  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    updatePreferences({ defaultLocation: newLoc });
  };

  const detail = activeKeyword ? getDetail(activeKeyword) : undefined;

  function handleSearch() {
    // If there's pending text in the input, add it as a chip first
    const finalChips = [...chips];
    if (inputValue.trim()) {
      const value = inputValue.trim().toLowerCase();
      if (!finalChips.includes(value)) {
        finalChips.push(value);
      }
      setChips(finalChips);
      setInputValue("");
    }
    if (finalChips.length > 0) {
      search(finalChips);
      const loc = getLocationByCode(location);
      for (const kw of finalChips) {
        recordSearch(userId, kw, "overview", loc.locationCode);
      }
    }
  }

  function handleExampleClick(kw: string) {
    const value = kw.toLowerCase();
    const newChips = chips.includes(value) ? chips : [...chips, value];
    setChips(newChips);
    // Intentionally do NOT search. User must click the Search button.
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:space-y-8 md:p-8">
      {/* Hero search section — centered like Semrush */}
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Keyword Overview</h1>
          <p className="mt-2 text-muted-foreground">Get comprehensive insights about any keyword</p>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <KeywordChipInput
              chips={chips}
              onChipsChange={setChips}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSubmit={handleSearch}
              disabled={loading}
              placeholder="Enter or paste keywords…"
            />

            <div className="flex items-center justify-center gap-3">
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
                disabled={loading || (chips.length === 0 && !inputValue.trim())}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Press Enter to add a keyword. Paste a comma or line-separated list to add many at
              once.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleKeywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleExampleClick(kw)}
                >
                  {kw}
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

      {loading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
        </>
      )}

      {/* Table mode: multiple results, no active keyword */}
      {!loading && results.length > 0 && activeKeyword === null && (
        <OverviewResultsTable
          results={results}
          errors={errors}
          onSelectKeyword={setActiveKeyword}
        />
      )}

      {/* Detail mode: active keyword selected */}
      {!loading && activeKeyword && detail && (
        <>
          <div className="flex items-center justify-center gap-3">
            {results.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => setActiveKeyword(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-2xl font-bold tracking-tight">{activeKeyword}</h2>
          </div>

          <OverviewMetrics results={detail.metrics} locationName={locationName} />

          {((detail.metrics.globalVolume && detail.metrics.globalVolume.length > 0) ||
            (detail.metrics.trend && detail.metrics.trend.length > 0)) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {detail.metrics.globalVolume && detail.metrics.globalVolume.length > 0 && (
                <VolumeBreakdown
                  globalVolume={detail.metrics.globalVolume}
                  primaryVolume={detail.metrics.volume}
                />
              )}
              {detail.metrics.trend && detail.metrics.trend.length > 0 && (
                <TrendChart trend={detail.metrics.trend} />
              )}
            </div>
          )}

          <SerpTable results={detail.serpResults} />
          <KeywordIdeasSection ideas={detail.keywordIdeas} />
        </>
      )}

      {/* Show errors when no results and not loading */}
      {!loading && results.length === 0 && errors.size > 0 && (
        <div className="mx-auto max-w-3xl space-y-2">
          {Array.from(errors.entries()).map(([kw, msg]) => (
            <AlertBanner key={kw} variant="error" message={`${kw}: ${msg}`} />
          ))}
        </div>
      )}
    </div>
  );
}
