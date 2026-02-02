"use client";

import { Search, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { FinderFilters } from "@/components/keywords/finder/finder-filters";
import { FinderResultsTable } from "@/components/keywords/finder/finder-results-table";
import { FinderSkeleton } from "@/components/keywords/finder/finder-skeleton";
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
import { useKeywordFinder } from "@/hooks/use-keyword-finder";
import { usePreferences } from "@/hooks/use-preferences";
import { getLocationByCode, locations } from "@/lib/locations";
import { recordSearch } from "@/lib/search-history-api";

const GROUPS = [
  { id: "all", name: "All Keywords" },
  { id: "question", name: "Questions" },
  { id: "related", name: "Related Keywords" },
  { id: "variation", name: "Variations" },
] as const;

export default function KeywordFinderPage() {
  const {
    seedKeyword,
    setSeedKeyword,
    location,
    setLocation,
    search,
    selectedGroup,
    handleGroupChange,
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
    groupCounts,
    buildKeywordsToSave,
  } = useKeywordFinder();

  const { userId } = useCurrentUser();
  const { preferences, updatePreferences } = usePreferences(userId);

  const appliedDefault = useRef(false);

  useEffect(() => {
    if (!appliedDefault.current && preferences.defaultLocation && !seedKeyword) {
      setLocation(preferences.defaultLocation);
      appliedDefault.current = true;
    }
  }, [preferences.defaultLocation, seedKeyword, setLocation]);

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    updatePreferences({ defaultLocation: newLoc });
  };

  const handleSearchWithHistory = () => {
    handleSearch();

    if (seedKeyword.trim()) {
      const loc = getLocationByCode(location);
      recordSearch(userId, seedKeyword.trim(), "finder", loc.locationCode);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto space-y-6 p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Keyword Finder</h1>
            <p className="mt-2 text-muted-foreground">
              Discover thousands of keyword ideas from a seed keyword
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <Input
                placeholder="Enter seed keyword (e.g., seo tools)"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchWithHistory()}
                disabled={search.loading}
              />

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
                    onClick={handleSearchWithHistory}
                    disabled={search.loading || !seedKeyword.trim()}
                  >
                    {search.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Find Keywords
                  </Button>
                </div>
                {seedKeyword.trim() && (
                  <p className="text-xs text-muted-foreground">Cost: $0.025 USDC</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {search.warning && <AlertBanner variant="warning" message={search.warning} />}
        {search.error && <AlertBanner variant="error" message={search.error} />}

        {search.loading && <FinderSkeleton />}

        {!search.loading && search.hasSearched && search.results.length === 0 && !search.error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No keyword ideas found. Try a different seed keyword.
              </p>
            </CardContent>
          </Card>
        )}

        {!search.loading && search.results.length > 0 && (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {GROUPS.map((group) => (
                <Button
                  key={group.id}
                  variant={selectedGroup === group.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleGroupChange(group.id)}
                >
                  {group.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {groupCounts[group.id] || 0}
                  </Badge>
                </Button>
              ))}
            </div>

            <FinderFilters filters={filters} onChange={handleFiltersChange} />

            <FinderResultsTable
              paginatedKeywords={paginatedKeywords}
              filteredCount={filteredKeywords.length}
              selectedKeywords={selectedKeywords}
              sortField={sort.field}
              sortDirection={sort.direction}
              currentPage={currentPage}
              totalPages={totalPages}
              onSort={handleSort}
              onToggleKeyword={toggleKeyword}
              onToggleAll={toggleAll}
              onPageChange={setCurrentPage}
              onOpenSaveDialog={() => setSaveDialogOpen(true)}
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
