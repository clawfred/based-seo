"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

import { CompetitorKeywordsFilters, type CompetitorFilters } from "@/components/domain/keywords/competitor-keywords-filters";
import { CompetitorKeywordsTable } from "@/components/domain/keywords/competitor-keywords-table";
import { CompetitorKeywordsSkeleton } from "@/components/domain/keywords/competitor-keywords-skeleton";
import { SaveToFolderDialog } from "@/components/keywords/finder/save-to-folder-dialog";
import { AlertBanner } from "@/components/shared/alert-banner";
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
import { usePreferences } from "@/hooks/use-preferences";
import { getLocationByCode, locations } from "@/lib/locations";
import { toCsv, downloadTextFile } from "@/lib/csv";
import type { CompetitorKeyword } from "@/app/api/domain/keywords/route";
import type { KeywordData } from "@/lib/types";

type SortField = "keyword" | "position" | "volume" | "traffic" | "kd" | "cpc";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 50;

export default function CompetitorKeywordsPage() {
  const { userId } = useCurrentUser();
  const { preferences, updatePreferences } = usePreferences(userId);
  const appliedDefault = useRef(false);

  // Form state
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("US");

  // Data state
  const [keywords, setKeywords] = useState<CompetitorKeyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [filters, setFilters] = useState<CompetitorFilters>({
    positionRange: "all",
    volumeMin: "",
    volumeMax: "",
    kdMin: "",
    kdMax: "",
  });

  // Sort state
  const [sortField, setSortField] = useState<SortField>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Selection state
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Apply default location preference
  useEffect(() => {
    if (!appliedDefault.current && preferences.defaultLocation && !domain) {
      setLocation(preferences.defaultLocation);
      appliedDefault.current = true;
    }
  }, [preferences.defaultLocation, domain]);

  const handleLocationChange = (newLoc: string) => {
    setLocation(newLoc);
    updatePreferences({ defaultLocation: newLoc });
  };

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setWarning(null);
    setHasSearched(true);
    setSelectedKeywords(new Set());
    setCurrentPage(1);

    try {
      const loc = getLocationByCode(location);
      const res = await fetch("/api/domain/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          locationCode: loc.locationCode,
          limit: 1000,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch keywords");
      }

      if (json.warning) {
        setWarning(json.warning);
      }

      setKeywords(json.data?.keywords || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setKeywords([]);
    } finally {
      setLoading(false);
    }
  }, [domain, location]);

  // Filter keywords
  const filteredKeywords = useMemo(() => {
    let result = [...keywords];

    // Position filter
    if (filters.positionRange !== "all") {
      const [min, max] = filters.positionRange.split("-").map(Number);
      result = result.filter((kw) => kw.position >= min && kw.position <= max);
    }

    // Volume filter
    const volumeMin = filters.volumeMin ? Number(filters.volumeMin) : 0;
    const volumeMax = filters.volumeMax ? Number(filters.volumeMax) : Infinity;
    result = result.filter((kw) => kw.volume >= volumeMin && kw.volume <= volumeMax);

    // KD filter
    const kdMin = filters.kdMin ? Number(filters.kdMin) : 0;
    const kdMax = filters.kdMax ? Number(filters.kdMax) : 100;
    result = result.filter((kw) => kw.kd >= kdMin && kw.kd <= kdMax);

    return result;
  }, [keywords, filters]);

  // Sort keywords
  const sortedKeywords = useMemo(() => {
    const sorted = [...filteredKeywords];
    sorted.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredKeywords, sortField, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedKeywords.length / ITEMS_PER_PAGE);
  const paginatedKeywords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedKeywords.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedKeywords, currentPage]);

  // Sort handler
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("desc");
      return field;
    });
    setCurrentPage(1);
  }, []);

  // Selection handlers
  const toggleKeyword = useCallback((keyword: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedKeywords((prev) => {
      if (prev.size === paginatedKeywords.length) {
        return new Set();
      }
      return new Set(paginatedKeywords.map((kw) => kw.keyword));
    });
  }, [paginatedKeywords]);

  // Build keywords for save dialog
  const buildKeywordsToSave = useCallback((): KeywordData[] => {
    return keywords
      .filter((kw) => selectedKeywords.has(kw.keyword))
      .map((kw) => ({
        keyword: kw.keyword,
        volume: kw.volume,
        kd: kw.kd,
        cpc: kw.cpc,
        competition: 0, // Not available from this API
        intent: kw.intent,
        trend: [], // Not available from this API
      }));
  }, [keywords, selectedKeywords]);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const headers = ["keyword", "position", "volume", "traffic", "url", "kd", "cpc", "intent"];
    const csv = toCsv(
      filteredKeywords.map((kw) => ({
        keyword: kw.keyword,
        position: kw.position,
        volume: kw.volume,
        traffic: kw.traffic,
        url: kw.url,
        kd: kw.kd,
        cpc: kw.cpc,
        intent: kw.intent,
      })),
      headers
    );
    downloadTextFile({
      filename: `competitor-keywords-${domain.replace(/[^a-z0-9]/gi, "-")}.csv`,
      content: csv,
      mimeType: "text/csv;charset=utf-8",
    });
  }, [filteredKeywords, domain]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto space-y-6 p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Competitor Keywords
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover what keywords any domain ranks for in organic search
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <Input
                placeholder="Enter domain (e.g., ahrefs.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
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
                    onClick={handleSearch}
                    disabled={loading || !domain.trim()}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Analyze Domain
                  </Button>
                </div>
                <p
                  className={`text-xs text-muted-foreground ${!domain.trim() ? "invisible" : ""}`}
                >
                  Cost: $0.025 USDC
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {warning && <AlertBanner variant="warning" message={warning} />}
        {error && <AlertBanner variant="error" message={error} />}

        {loading && <CompetitorKeywordsSkeleton />}

        {!loading && hasSearched && keywords.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No ranked keywords found for this domain. Try a different domain.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && keywords.length > 0 && (
          <>
            <CompetitorKeywordsFilters filters={filters} onChange={setFilters} />

            <CompetitorKeywordsTable
              paginatedKeywords={paginatedKeywords}
              filteredCount={filteredKeywords.length}
              selectedKeywords={selectedKeywords}
              sortField={sortField}
              sortDirection={sortDirection}
              currentPage={currentPage}
              totalPages={totalPages}
              onSort={handleSort}
              onToggleKeyword={toggleKeyword}
              onToggleAll={toggleAll}
              onPageChange={setCurrentPage}
              onOpenSaveDialog={() => setSaveDialogOpen(true)}
              onExportCsv={handleExportCsv}
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
