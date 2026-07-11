"use client";

import { Search, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const EXAMPLES = ["ahrefs.com", "vercel.com", "stripe.com", "news.ycombinator.com"];

interface BacklinksSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Combined USD cost of a full search, from the live manifest. */
  totalUsd: number;
  pricesLoading: boolean;
}

export function BacklinksSearch({
  value,
  onChange,
  onSubmit,
  loading,
  totalUsd,
  pricesLoading,
}: BacklinksSearchProps) {
  const disabled = loading || value.trim().length === 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) onSubmit();
              }}
              disabled={loading}
              placeholder="Enter a domain or URL, e.g. example.com"
              className="h-12 pl-9 text-base"
              autoFocus
            />
          </div>
          <Button onClick={onSubmit} disabled={disabled} className="h-12 gap-2 px-6">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Analyze
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {EXAMPLES.map((domain) => (
              <Badge
                key={domain}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => !loading && onChange(domain)}
              >
                {domain}
              </Badge>
            ))}
          </div>
          {!pricesLoading && totalUsd > 0 && (
            <span className="text-xs text-muted-foreground">
              Full report:{" "}
              <span className="font-medium text-foreground">${totalUsd.toFixed(2)}</span> USDC
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
