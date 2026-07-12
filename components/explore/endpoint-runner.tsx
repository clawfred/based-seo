"use client";

import { useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEndpointRunner } from "@/hooks/use-endpoint-runner";
import type { EndpointDef } from "@/lib/registry";
import type { ParamField } from "@/lib/registry/param-fields";
import { ResultView } from "./result-view";

interface Props {
  endpoint: EndpointDef;
  fields: ParamField[];
  priceUsd: number;
  confidence: EndpointDef["priceConfidence"];
}

/**
 * A form for one endpoint's params and a run button. Coerces field values by
 * declared kind, then posts the task to `/api/v3/{slug}` through the runner
 * hook, which owns the x402 payment loop.
 */
export function EndpointRunner({ endpoint, fields, priceUsd, confidence }: Props) {
  const { state, run, hasWallet } = useEndpointRunner();
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields));

  const missingRequired = useMemo(
    () => fields.some((f) => f.required && !values[f.name]?.trim()),
    [fields, values],
  );

  const onRun = () => {
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name]?.trim();
      if (!raw) continue;
      body[field.name] = coerce(raw, field.kind);
    }
    run({ slug: endpoint.slug, method: endpoint.method, body });
  };

  const running = state.status === "running";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono text-[11px]">
          {endpoint.method}
        </Badge>
        <code className="text-sm text-muted-foreground">/api/v3/{endpoint.slug}</code>
        <span className="ml-auto flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{priceUsd === 0 ? "Free" : `$${priceUsd}`}</span>
          {confidence === "estimated" && (
            <Badge variant="outline" className="text-[10px]">
              est.
            </Badge>
          )}
        </span>
      </div>

      {endpoint.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{endpoint.description}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              {field.name}
              {field.required && <span className="text-destructive">*</span>}
              <span className="text-xs font-normal text-muted-foreground">{field.kind}</span>
            </span>
            <Input
              value={values[field.name] ?? ""}
              placeholder={field.placeholder ?? hint(field.kind)}
              onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
            />
            {field.aliases.length > 1 && (
              <span className="text-xs text-muted-foreground">
                or {field.aliases.slice(1).join(", ")}
              </span>
            )}
          </label>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">This endpoint takes no parameters.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onRun} disabled={running || missingRequired}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {running ? "Running…" : priceUsd === 0 ? "Run" : hasWallet ? `Run · $${priceUsd}` : "Run"}
        </Button>
        {!hasWallet && priceUsd > 0 && (
          <span className="text-xs text-muted-foreground">
            Connect a wallet to pay per request, or preview the price first.
          </span>
        )}
      </div>

      <ResultView state={state} priceUsd={priceUsd} />
    </div>
  );
}

function initialValues(fields: ParamField[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) if (f.placeholder) out[f.name] = f.placeholder;
  return out;
}

function coerce(raw: string, kind: ParamField["kind"]): unknown {
  switch (kind) {
    case "number":
      return Number(raw);
    case "boolean":
      return raw === "true" || raw === "1";
    case "array":
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    case "object":
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}

function hint(kind: ParamField["kind"]): string {
  if (kind === "array") return "comma,separated,values";
  if (kind === "object") return '{"key":"value"}';
  if (kind === "boolean") return "true / false";
  return "";
}
