"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EndpointDef } from "@/lib/registry";
import type { ParamField } from "@/lib/registry/param-fields";
import { EndpointRunner } from "./endpoint-runner";

/** Endpoint plus its precomputed fields and price, passed from the server page. */
export interface ExplorerEntry {
  endpoint: EndpointDef;
  fields: ParamField[];
  priceUsd: number;
}

/**
 * Two-pane explorer: a filterable list of a family's endpoints on the left, a
 * runner for the selected one on the right. All data is precomputed on the
 * server; this component only handles selection and filtering.
 */
export function FamilyExplorer({ entries }: { entries: ExplorerEntry[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(entries[0]?.endpoint.id ?? "");

  const filtered = query.trim()
    ? entries.filter((e) => e.endpoint.slug.toLowerCase().includes(query.trim().toLowerCase()))
    : entries;

  const selected = entries.find((e) => e.endpoint.id === selectedId) ?? filtered[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
      <div className="flex flex-col gap-3">
        <Input
          placeholder={`Filter ${entries.length} endpoints…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto pr-1">
          {filtered.map(({ endpoint, priceUsd }) => (
            <button
              key={endpoint.id}
              onClick={() => setSelectedId(endpoint.id)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                endpoint.id === selected?.endpoint.id
                  ? "border-primary/40 bg-primary/5"
                  : "border-transparent hover:bg-accent",
              )}
            >
              <span className="truncate font-mono text-xs">
                {endpoint.slug.replace(/\/live$/, "")}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {priceUsd === 0 ? "free" : `$${priceUsd}`}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        {selected ? (
          <EndpointRunner
            key={selected.endpoint.id}
            endpoint={selected.endpoint}
            fields={selected.fields}
            priceUsd={selected.priceUsd}
            confidence={selected.endpoint.priceConfidence}
          />
        ) : (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Badge variant="outline">empty</Badge>
            Select an endpoint to run it.
          </div>
        )}
      </div>
    </div>
  );
}
