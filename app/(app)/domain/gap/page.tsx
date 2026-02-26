"use client";

import { Search, Loader2, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { GapFilters } from "@/components/domain/gap/gap-filters";
import { GapResultsTable } from "@/components/domain/gap/gap-results-table";
import { GapSkeleton } from "@/components/domain/gap/gap-skeleton";
import { SaveToFolderDialog } from "@/components/keywords/finder/save-to-folder-dialog";
import { AlertBanner } from "@/components/shared/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useKeywordGap, type GapTab } from "@/hooks/use-keyword-gap";
import { usePreferences } from "@/hooks/use-preferences";
import { locations } from "@/lib/locations";
import type { KeywordData } from "@/lib/types";

const TABS: { id: GapTab; name: string; description: string }[] = [
  { id: "missing", name: "Missing", description: "Keywords competitors rank for that you don't" },
  { id: "weak", name: "Weak", description: "Keywords where you rank lower than competitors" },
  { id: "shared", name: "Shared", description: "Keywords both you and competitors rank for" },
];

export default function KeywordGapPage() {
  const {
    yourDomain,
    setYourDomain,
    competitors,
    updateCompetitor,
    location,
    setLocation,
    search,
    selectedTab,
    handleTabChange,
    selectedKeywords,
    setSelectedKeywords,
    sort,
    filters,
    currentPage,
    setCurrentPage,
    saveDialogOpen,
    setSaveDialogOpen,
    handleSearch,
    handleSort,
    handleFiltersChange,
    filteredKeywords,
    toggleKeyword,
    toggleAll,
    paginatedKeywords,
    totalPages,
    tabCounts,
    exportToCSV,
  } = useKeywordGap();

  const { userId } = useCurrentUser();
  const { preferences, updatePreferences } = usePreferences(userId);

  const appliedDefault = useRef(false);

  useEffect(() => {
    if (!appliedDefault.current && preferences.defaultLocation && !yourDomain) {
      setLocation(preferences.defaultLocation);
      appliedDefault.current = true;
    }
  }, [preferences.defaultLocation, yourDomain, setLocation]);

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    updatePreferences({ defaultLocation: newLoc });
  };

  const validCompetitorCount = competitors.filter((c) => c.trim()).length;
  const canSearch = yourDomain.trim() && validCompetitorCount > 0;

  const buildKeywordsToSave = (): KeywordData[] => {
    return filteredKeywords
      .filter((k) => selectedKeywords.has(k.keyword))
      .map((k) => ({
        keyword: k.keyword,
        volume: k.volume,
        kd: k.kd,
        cpc: k.cpc,
        competition: k.competition,
        intent: "Commercial" as const,
        trend: [],
      }));
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto space-y-6 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Keyword Gap Analysis</h1>
            <p className="mt-2 text-muted-foreground">
              Discover keyword opportunities by comparing your domain with competitors
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              {/* Your Domain */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">Your Domain</label>
                <Input
                  placeholder="yourdomain.com"
                  value={yourDomain}
                  onChange={(e) => setYourDomain(e.target.value)}
                  disabled={search.loading}
                />
              </div>

              {/* Competitor Domains */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-left block">
                  Competitor Domains (up to 3)
                </label>
                <div className="grid gap-2 md:grid-cols-3">
                  {competitors.map((comp, index) => (
                    <div key={index} className="relative">
                      <Input
                        placeholder={`competitor${index + 1}.com`}
                        value={comp}
                        onChange={(e) => updateCompetitor(index, e.target.value)}
                        disabled={search.loading}
                        className="pr-8"
                      />
                      {comp && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => updateCompetitor(index, "")}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <Select value={location} onValueChange={handleLocationChange}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
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
                    className="gap-2"
                    onClick={handleSearch}
                    disabled={search.loading || !canSearch}
                  >
                    {search.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Analyze Gap
                  </Button>
                </div>
                <p
                  className={`text-xs text-muted-foreground ${!canSearch ? "invisible" : ""}`}
                >
                  Cost: $0.05 USDC
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {search.warning && <AlertBanner variant="warning" message={search.warning} />}
        {search.error && <AlertBanner variant="error" message={search.error} />}

        {search.loading && <GapSkeleton />}

        {!search.loading && search.hasSearched && !search.data && !search.error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No keyword gap data found. Try different domains.
              </p>
            </CardContent>
          </Card>
        )}

        {!search.loading && search.data && (
          <>
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {TABS.map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTabChange(tab.id)}
                  title={tab.description}
                >
                  {tab.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {tabCounts[tab.id] || 0}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Tab description */}
            <p className="text-center text-sm text-muted-foreground">
              {TABS.find((t) => t.id === selectedTab)?.description}
            </p>

            <GapFilters filters={filters} onChange={handleFiltersChange} />

            <GapResultsTable
              paginatedKeywords={paginatedKeywords}
              filteredCount={filteredKeywords.length}
              selectedKeywords={selectedKeywords}
              sortField={sort.field}
              sortDirection={sort.direction}
              currentPage={currentPage}
              totalPages={totalPages}
              competitors={search.data.competitors}
              onSort={handleSort}
              onToggleKeyword={toggleKeyword}
              onToggleAll={toggleAll}
              onPageChange={setCurrentPage}
              onOpenSaveDialog={() => setSaveDialogOpen(true)}
              onExportCSV={exportToCSV}
            />
          </>
        )}
      </div>

      <SaveToFolderDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        selectedCount={selectedKeywords.size}
        onSave={buildKeywordsToSave}
        onClearSelection={() => setSelectedKeywords(new Set())}
      />
    </div>
  );
}
