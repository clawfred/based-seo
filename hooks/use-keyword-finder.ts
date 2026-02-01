"use client";

import { useState, useMemo, useCallback } from "react";
import { getLocationByCode } from "@/lib/locations";
import { fetchKeywordIdeas, type KeywordIdeaWithMeta } from "@/lib/api";
import { ideaToKeywordData } from "@/lib/keyword-transforms";
import type { SearchState } from "@/hooks/search-reducer";
import type { FilterValues } from "@/components/keywords/finder/finder-filters";
import type { KeywordData } from "@/lib/types";

type SortField = "keyword" | "volume" | "kd" | "cpc" | "competition";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 20;
const DEFAULT_FILTERS: FilterValues = {
  volumeMin: "",
  volumeMax: "",
  kdMin: "",
  kdMax: "",
  intentFilter: "all",
};

// Module-level state that survives page navigations
let persistedSeedKeyword = "";
let persistedLocation = "US";
let persistedSearch: SearchState = {
  loading: false,
  error: null,
  warning: null,
  results: [],
  hasSearched: false,
};
let persistedSelectedGroup = "all";
let persistedSort: { field: SortField; direction: SortDirection } = {
  field: "volume",
  direction: "desc",
};
let persistedFilters: FilterValues = DEFAULT_FILTERS;
let persistedCurrentPage = 1;

export function useKeywordFinder() {
  const [seedKeyword, _setSeedKeyword] = useState(persistedSeedKeyword);
  const [location, _setLocation] = useState(persistedLocation);
  const [search, _setSearch] = useState<SearchState>(persistedSearch);
  const [selectedGroup, _setSelectedGroup] = useState(persistedSelectedGroup);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [sort, _setSort] = useState(persistedSort);
  const [filters, _setFilters] = useState<FilterValues>(persistedFilters);
  const [currentPage, _setCurrentPage] = useState(persistedCurrentPage);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Wrappers that sync to module-level storage
  const setSeedKeyword = useCallback((v: string) => {
    persistedSeedKeyword = v;
    _setSeedKeyword(v);
  }, []);

  const setLocation = useCallback((v: string) => {
    persistedLocation = v;
    _setLocation(v);
  }, []);

  const setSearch = useCallback((v: SearchState) => {
    persistedSearch = v;
    _setSearch(v);
  }, []);

  const setSelectedGroup = useCallback((v: string) => {
    persistedSelectedGroup = v;
    _setSelectedGroup(v);
  }, []);

  const setSort = useCallback((v: { field: SortField; direction: SortDirection }) => {
    persistedSort = v;
    _setSort(v);
  }, []);

  const setFilters = useCallback((v: FilterValues) => {
    persistedFilters = v;
    _setFilters(v);
  }, []);

  const setCurrentPage = useCallback((v: number) => {
    persistedCurrentPage = v;
    _setCurrentPage(v);
  }, []);

  const handleSearch = useCallback(async () => {
    const kw = seedKeyword.trim();
    if (!kw) return;

    setSearch({ ...search, loading: true, error: null, warning: null, hasSearched: true });
    setCurrentPage(1);
    setSelectedKeywords(new Set());

    const loc = getLocationByCode(location);

    try {
      const res = await fetchKeywordIdeas(kw, loc.locationCode, loc.languageCode);
      setSearch({
        loading: false,
        error: null,
        warning: res.warning ?? null,
        results: res.data || [],
        hasSearched: true,
      });
    } catch (err) {
      setSearch({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch keyword ideas",
        warning: null,
        results: [],
        hasSearched: true,
      });
    }
  }, [seedKeyword, location, search, setSearch, setCurrentPage]);

  const handleSort = useCallback(
    (field: SortField) => {
      setSort(
        sort.field === field
          ? { field, direction: sort.direction === "asc" ? "desc" : "asc" }
          : { field, direction: "desc" },
      );
    },
    [sort, setSort],
  );

  const handleFiltersChange = useCallback(
    (next: FilterValues) => {
      setFilters(next);
      setCurrentPage(1);
    },
    [setFilters, setCurrentPage],
  );

  const handleGroupChange = useCallback(
    (group: string) => {
      setSelectedGroup(group);
      setCurrentPage(1);
    },
    [setSelectedGroup, setCurrentPage],
  );

  const filteredKeywords = useMemo(() => {
    const { volumeMin, volumeMax, kdMin, kdMax, intentFilter } = filters;
    const vMin = volumeMin ? parseInt(volumeMin) : -Infinity;
    const vMax = volumeMax ? parseInt(volumeMax) : Infinity;
    const kMin = kdMin ? parseInt(kdMin) : -Infinity;
    const kMax = kdMax ? parseInt(kdMax) : Infinity;
    const checkIntent = intentFilter && intentFilter !== "all";

    const filtered = search.results.filter(
      (k) =>
        (selectedGroup === "all" || k.type === selectedGroup) &&
        k.volume >= vMin &&
        k.volume <= vMax &&
        k.kd >= kMin &&
        k.kd <= kMax &&
        (!checkIntent || k.intent === intentFilter),
    );

    const dir = sort.direction === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const aVal = a[sort.field as keyof KeywordIdeaWithMeta];
      const bVal = b[sort.field as keyof KeywordIdeaWithMeta];
      if (typeof aVal === "string" && typeof bVal === "string")
        return aVal.localeCompare(bVal) * dir;
      return (((aVal as number) ?? 0) - ((bVal as number) ?? 0)) * dir;
    });
    return filtered;
  }, [search.results, selectedGroup, filters, sort]);

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

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: search.results.length };
    for (const kw of search.results) {
      counts[kw.type] = (counts[kw.type] || 0) + 1;
    }
    return counts;
  }, [search.results]);

  const buildKeywordsToSave = useCallback((): KeywordData[] => {
    return search.results.filter((k) => selectedKeywords.has(k.keyword)).map(ideaToKeywordData);
  }, [search.results, selectedKeywords]);

  return {
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
  };
}
