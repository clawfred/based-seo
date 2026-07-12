"use client";

import { useEffect, useState } from "react";

/**
 * Loads the valid `model_name` values for an engine from its free `/models`
 * reference endpoint, so the dropdown always offers models DataForSEO accepts.
 * Falls back to the caller's curated defaults if the fetch fails or is empty.
 */
export function useLlmModels(modelsSlug: string, fallback: string[]): string[] {
  const [models, setModels] = useState<string[]>(fallback);

  useEffect(() => {
    let cancelled = false;
    setModels(fallback);

    (async () => {
      try {
        const res = await fetch(`/api/v3/${modelsSlug}`);
        if (!res.ok) return;
        const json = (await res.json()) as { data?: unknown };
        const names = extractModelNames(json.data);
        if (!cancelled && names.length > 0) setModels(names);
      } catch {
        // Keep the fallback list.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelsSlug, fallback]);

  return models;
}

/** Model reference endpoints return either bare strings or `{ model_name }` rows. */
function extractModelNames(data: unknown): string[] {
  const result = (data as { tasks?: Array<{ result?: unknown[] | null }> })?.tasks?.[0]?.result;
  const rows = Array.isArray(result?.[0]) ? (result[0] as unknown[]) : collectItems(result);

  const names: string[] = [];
  for (const row of rows) {
    if (typeof row === "string") names.push(row);
    else if (row && typeof row === "object") {
      const r = row as Record<string, unknown>;
      const name = r.model_name ?? r.name ?? r.model ?? r.id;
      if (typeof name === "string") names.push(name);
    }
  }
  return [...new Set(names)];
}

/** Flatten `result` entries and their `.items` into a single row list. */
function collectItems(result: unknown[] | null | undefined): unknown[] {
  if (!Array.isArray(result)) return [];
  const rows: unknown[] = [];
  for (const entry of result) {
    const items = (entry as { items?: unknown[] } | null)?.items;
    if (Array.isArray(items)) rows.push(...items);
    else if (entry) rows.push(entry);
  }
  return rows;
}
