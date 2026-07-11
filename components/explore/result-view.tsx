"use client";

import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RunState } from "@/hooks/use-endpoint-runner";

/**
 * Renders whatever the runner produced: a payment prompt, an error, or the raw
 * DataForSEO result as pretty JSON. Deliberately shows the real payload — the
 * explorer is for people who want to see exactly what an endpoint returns.
 */
export function ResultView({ state, priceUsd }: { state: RunState; priceUsd: number }) {
  if (state.status === "idle" || state.status === "running") return null;

  if (state.status === "needs-payment") {
    return (
      <Panel tone="amber" icon={<Wallet className="size-4" />}>
        <p className="font-medium">Payment required - ${state.priceUsd || priceUsd}</p>
        <p className="text-sm text-muted-foreground">
          Connect a wallet in the header to pay per request with USDC on Base. No subscription; you
          pay only for this call.
        </p>
      </Panel>
    );
  }

  if (state.status === "error") {
    return (
      <Panel tone="red" icon={<AlertCircle className="size-4" />}>
        <p className="font-medium">
          Request failed{state.httpStatus ? ` (${state.httpStatus})` : ""}
        </p>
        <p className="text-sm text-muted-foreground">{state.message}</p>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="size-4 text-emerald-500" />
        <span className="font-medium">Success</span>
        {state.source && (
          <Badge variant="outline" className="text-[10px]">
            {state.source === "free" ? "free" : `paid via ${state.source}`}
            {state.amount && state.amount !== "$0" ? ` · ${state.amount}` : ""}
          </Badge>
        )}
      </div>
      <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
        {JSON.stringify(state.data, null, 2)}
      </pre>
    </div>
  );
}

function Panel({
  tone,
  icon,
  children,
}: {
  tone: "amber" | "red";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
      : "border-destructive/30 bg-destructive/5 text-destructive";
  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${toneClass}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex flex-col gap-1 text-foreground">{children}</div>
    </div>
  );
}
