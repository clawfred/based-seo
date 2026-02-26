"use client";

import { useState, useCallback } from "react";
import { getLocationByCode } from "@/lib/locations";
import { fetchDomainOverview } from "@/lib/api";

export interface DomainOverviewData {
  domain: string;
  rank: number;
  organicTraffic: number;
  organicKeywords: number;
  backlinks: number;
  avgPosition: number;
  trafficCost: number;
  trafficHistory: Array<{
    year: number;
    month: number;
    etv: number;
    keywords?: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    position: number;
    volume: number;
    trafficShare: number;
    cpc?: number;
    difficulty?: number;
  }>;
}

export function useDomainOverview() {
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("US");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DomainOverviewData | null>(null);

  const search = useCallback(
    async (overrideDomain?: string) => {
      const targetDomain = overrideDomain ?? domain;
      if (!targetDomain.trim()) return;

      setLoading(true);
      setWarning(null);
      setError(null);

      const loc = getLocationByCode(location);

      try {
        const result = await fetchDomainOverview(targetDomain, loc.locationCode);

        if (result.data) {
          setData(result.data);
          if (result.warning) {
            setWarning(result.warning);
          }
        } else {
          setError(result.error || "Failed to fetch domain data");
          setData(null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to fetch";
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [domain, location],
  );

  const reset = useCallback(() => {
    setDomain("");
    setData(null);
    setError(null);
    setWarning(null);
  }, []);

  return {
    domain,
    setDomain,
    location,
    setLocation,
    search,
    loading,
    warning,
    error,
    data,
    reset,
  };
}
