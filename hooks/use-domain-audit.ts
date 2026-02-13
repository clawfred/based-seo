"use client";

import { useState, useCallback } from "react";
import { fetchDomainAudit, type AuditResult } from "@/lib/api";

export function useDomainAudit() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const runAudit = useCallback(async (targetUrl?: string) => {
    const auditUrl = targetUrl || url;
    if (!auditUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchDomainAudit(auditUrl);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setResult(response.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run audit");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const reset = useCallback(() => {
    setUrl("");
    setError(null);
    setResult(null);
  }, []);

  return {
    url,
    setUrl,
    loading,
    error,
    result,
    runAudit,
    reset,
  };
}
