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

export function useKeywordOverview() {
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [location, setLocation] = useState("US");
  const [cache, setCache] = useState<Map<string, CachedResult>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

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

      if (keywords.length === 1 && newCache.has(keywords[0])) {
        setActiveKeyword(keywords[0]);
      } else {
        setActiveKeyword(null);
      }
    },
    [chips, location],
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
