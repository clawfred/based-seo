"use client";

import { useState, useCallback, useMemo } from "react";
import { getLocationByCode } from "@/lib/locations";
import { fetchCompleteKeywordData, fetchKeywordOverviewBatch } from "@/lib/api";
import type { KeywordMetrics, SerpResult } from "@/lib/types";
import type { KeywordIdeaWithMeta } from "@/lib/api";

interface CachedResult {
  metrics: KeywordMetrics;
  serpResults: SerpResult[];
  keywordIdeas: KeywordIdeaWithMeta[];
}

// Module-level state that survives page navigations
let persistedChips: string[] = [];
let persistedLocation = "US";
let persistedCache: Map<string, CachedResult> = new Map();
let persistedErrors: Map<string, string> = new Map();
let persistedWarning: string | null = null;
let persistedActiveKeyword: string | null = null;

export function useKeywordOverview() {
  const [chips, _setChips] = useState<string[]>(persistedChips);
  const [inputValue, setInputValue] = useState("");
  const [location, _setLocation] = useState(persistedLocation);
  const [cache, _setCache] = useState<Map<string, CachedResult>>(persistedCache);
  const [errors, _setErrors] = useState<Map<string, string>>(persistedErrors);
  const [loading, setLoading] = useState(false);
  const [warning, _setWarning] = useState<string | null>(persistedWarning);
  const [activeKeyword, _setActiveKeyword] = useState<string | null>(persistedActiveKeyword);

  // Wrappers that sync to module-level storage
  const setChips = useCallback((v: string[]) => {
    persistedChips = v;
    _setChips(v);
  }, []);

  const setLocation = useCallback((v: string) => {
    persistedLocation = v;
    _setLocation(v);
  }, []);

  const setCache = useCallback((v: Map<string, CachedResult>) => {
    persistedCache = v;
    _setCache(v);
  }, []);

  const setErrors = useCallback((v: Map<string, string>) => {
    persistedErrors = v;
    _setErrors(v);
  }, []);

  const setWarning = useCallback((v: string | null) => {
    persistedWarning = v;
    _setWarning(v);
  }, []);

  const setActiveKeyword = useCallback((v: string | null) => {
    persistedActiveKeyword = v;
    _setActiveKeyword(v);
  }, []);

  const search = useCallback(
    async (overrideChips?: string[]) => {
      const keywords = overrideChips ?? chips;
      if (keywords.length === 0) return;

      setLoading(true);
      setWarning(null);

      const loc = getLocationByCode(location);

      const newCache = new Map<string, CachedResult>();
      const newErrors = new Map<string, string>();
      let firstWarning: string | null = null;

      // Prefer a single x402 payment for multi-keyword searches.
      if (keywords.length > 1) {
        try {
          const batch = await fetchKeywordOverviewBatch(
            keywords,
            loc.locationCode,
            loc.languageCode,
          );

          if (batch.warning && !firstWarning) {
            firstWarning = batch.warning;
          }

          if (batch.data) {
            // Server returns items in the same order as keywords.
            for (let i = 0; i < keywords.length; i++) {
              const keyword = keywords[i];
              const item = batch.data[i];

              if (!item) {
                newErrors.set(keyword, "Failed to fetch");
                continue;
              }

              if (item.error) {
                newErrors.set(keyword, item.error);
                continue;
              }

              newCache.set(keyword, {
                metrics: item.overview,
                serpResults: item.serp || [],
                keywordIdeas: item.ideas || [],
              });
            }
          } else {
            // Batch-level error
            for (const keyword of keywords) {
              newErrors.set(keyword, batch.error || "Failed to fetch");
            }
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to fetch";
          for (const keyword of keywords) {
            newErrors.set(keyword, message);
          }
        }
      } else {
        // Single keyword: keep the simple call path.
        const keyword = keywords[0];
        try {
          const result = await fetchCompleteKeywordData(
            keyword,
            loc.locationCode,
            loc.languageCode,
          );

          if (result.data) {
            if (result.warning && !firstWarning) {
              firstWarning = result.warning;
            }
            newCache.set(keyword, {
              metrics: result.data.overview,
              serpResults: result.data.serp || [],
              keywordIdeas: result.data.ideas || [],
            });
          } else {
            newErrors.set(keyword, result.error || "Failed to fetch");
          }
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to fetch";
          newErrors.set(keyword, message);
        }
      }

      setCache(newCache);
      setErrors(newErrors);
      setWarning(firstWarning);
      setLoading(false);

      // If single keyword searched, go directly to detail view
      if (keywords.length === 1 && newCache.has(keywords[0])) {
        setActiveKeyword(keywords[0]);
      } else {
        setActiveKeyword(null);
      }
    },
    [chips, location, setCache, setErrors, setWarning, setActiveKeyword],
  );

  const results = useMemo(() => {
    return Array.from(cache.values()).map((cached) => cached.metrics);
  }, [cache]);

  const getDetail = useCallback(
    (keyword: string): CachedResult | undefined => {
      return cache.get(keyword);
    },
    [cache],
  );

  return {
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
  };
}
