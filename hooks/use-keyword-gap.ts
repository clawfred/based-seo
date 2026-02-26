"use client";

import { useState, useMemo, useCallback } from "react";
import { fetchKeywordGap, type KeywordGapData, type KeywordGapItem } from "@/lib/api";
import { getLocationByCode } from "@/lib/locations";

export type GapTab = "missing" | "weak" | "shared";
type SortField = "keyword" | "yourPosition" | "volume" | "kd" | "trafficPotential";
type SortDirection = "asc" | "desc";

export interface GapFilterValues {
  volumeMin: string;
  volumeMax: string;
  kdMin: string;
  kdMax: string;
}

interface SearchState {
  loading: boolean;
  error: string | null;
  warning: string | null;
  data: KeywordGapData | null;
  hasSearched: boolean;
}

const ITEMS_PER_PAGE = 20;
const DEFAULT_FILTERS: GapFilterValues = {
  volumeMin: "",
  volumeMax: "",
  kdMin: "",
  kdMax: "",
};

export function useKeywordGap() {
  const [yourDomain, setYourDomain] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(["", "", ""]);
  const [location, setLocation] = useState("US");
  const [search, setSearch] = useState<SearchState>({
    loading: false,
    error: null,
    warning: null,
    data: null,
    hasSearched: false,
  });
  const [selectedTab, setSelectedTab] = useState<GapTab>("missing");
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "volume",
    direction: "desc",
  });
  const [filters, setFilters] = useState<GapFilterValues>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const updateCompetitor = useCallback((index: number, value: string) => {
    setCompetitors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleSearch = useCallback(async () => {
    const domain = yourDomain.trim();
    if (!domain) return;

    const validCompetitors = competitors.map((c) => c.trim()).filter(Boolean);
    if (validCompetitors.length === 0) return;

    setSearch({ loading: true, error: null, warning: null, data: null, hasSearched: true });
    setCurrentPage(1);
    setSelectedKeywords(new Set());

    const loc = getLocationByCode(location);

    try {
      const res = await fetchKeywordGap(domain, validCompetitors, loc.locationCode);
      setSearch({
        loading: false,
        error: null,
        warning: res.warning ?? null,
        data: res.data || null,
        hasSearched: true,
      });
    } catch (err) {
      setSearch({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch keyword gap data",
        warning: null,
        data: null,
        hasSearched: true,
      });
    }
  }, [yourDomain, competitors, location]);

  const handleSort = useCallback(
    (field: SortField) => {
      setSort(
        sort.field === field
          ? { field, direction: sort.direction === "asc" ? "desc" : "asc" }
          : { field, direction: "desc" },
      );
    },
    [sort],
  );

  const handleFiltersChange = useCallback((next: GapFilterValues) => {
    setFilters(next);
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tab: GapTab) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  }, []);

  // Categorize keywords into tabs
  const categorizedKeywords = useMemo(() => {
    if (!search.data) {
      return { missing: [], weak: [], shared: [] };
    }

    const missing: KeywordGapItem[] = [];
    const weak: KeywordGapItem[] = [];
    const shared: KeywordGapItem[] = [];

    for (const kw of search.data.keywords) {
      const yourPos = kw.yourPosition;
      const competitorPositions = Object.values(kw.competitorPositions).filter(
        (p): p is number => p !== null
      );
      const bestCompetitorPos = competitorPositions.length > 0 
        ? Math.min(...competitorPositions) 
        : null;

      if (yourPos === null && bestCompetitorPos !== null) {
        // Missing: competitors rank, you don't
        missing.push(kw);
      } else if (yourPos !== null && bestCompetitorPos !== null) {
        if (yourPos > bestCompetitorPos) {
          // Weak: you rank lower (higher number = worse position)
          weak.push(kw);
        } else {
          // Shared: you rank same or better
          shared.push(kw);
        }
      } else if (yourPos !== null && bestCompetitorPos === null) {
        // You rank but competitors don't - put in shared
        shared.push(kw);
      }
    }

    return { missing, weak, shared };
  }, [search.data]);

  const currentKeywords = useMemo(() => {
    return categorizedKeywords[selectedTab] || [];
  }, [categorizedKeywords, selectedTab]);

  const filteredKeywords = useMemo(() => {
    const { volumeMin, volumeMax, kdMin, kdMax } = filters;
    const vMin = volumeMin ? parseInt(volumeMin) : -Infinity;
    const vMax = volumeMax ? parseInt(volumeMax) : Infinity;
    const kMin = kdMin ? parseInt(kdMin) : -Infinity;
    const kMax = kdMax ? parseInt(kdMax) : Infinity;

    const filtered = currentKeywords.filter(
      (k) =>
        k.volume >= vMin &&
        k.volume <= vMax &&
        k.kd >= kMin &&
        k.kd <= kMax
    );

    const dir = sort.direction === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const aVal = a[sort.field as keyof KeywordGapItem];
      const bVal = b[sort.field as keyof KeywordGapItem];
      
      // Handle null positions
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir;
      }
      return (((aVal as number) ?? 0) - ((bVal as number) ?? 0)) * dir;
    });
    
    return filtered;
  }, [currentKeywords, filters, sort]);

  const toggleKeyword = useCallback((keyword: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedKeywords((prev) =>
      prev.size === filteredKeywords.length
        ? new Set()
        : new Set(filteredKeywords.map((k) => k.keyword)),
    );
  }, [filteredKeywords]);

  const paginatedKeywords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredKeywords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredKeywords, currentPage]);

  const totalPages = Math.ceil(filteredKeywords.length / ITEMS_PER_PAGE);

  const tabCounts = useMemo(() => ({
    missing: categorizedKeywords.missing.length,
    weak: categorizedKeywords.weak.length,
    shared: categorizedKeywords.shared.length,
  }), [categorizedKeywords]);

  const exportToCSV = useCallback(() => {
    if (!search.data) return;

    const competitors = search.data.competitors;
    const headers = [
      "Keyword",
      "Your Position",
      ...competitors.map((c) => `${c} Position`),
      "Volume",
      "KD",
      "CPC",
      "Traffic Potential",
    ];

    const rows = filteredKeywords.map((kw) => [
      kw.keyword,
      kw.yourPosition ?? "—",
      ...competitors.map((c) => kw.competitorPositions[c] ?? "—"),
      kw.volume,
      kw.kd,
      kw.cpc,
      kw.trafficPotential,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keyword-gap-${selectedTab}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [search.data, filteredKeywords, selectedTab]);

  return {
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
  };
}
