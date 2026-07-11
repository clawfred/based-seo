"use client";

import { Search, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const EXAMPLES = ["notion.so", "figma.com", "vercel.com", "linear.app"];

interface BrandSearchProps {
  brand: string;
  keyword: string;
  onBrandChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Combined USD cost of a full run, from the live manifest. */
  totalUsd: number;
  pricesLoading: boolean;
}

export function BrandSearch({
  brand,
  keyword,
  onBrandChange,
  onKeywordChange,
  onSubmit,
  loading,
  totalUsd,
  pricesLoading,
}: BrandSearchProps) {
  const disabled = loading || brand.trim().length === 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={brand}
              onChange={(e) => onBrandChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) onSubmit();
              }}
              disabled={loading}
              placeholder="Brand or domain, e.g. notion.so"
              className="h-12 pl-9 text-base"
              autoFocus
            />
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) onSubmit();
              }}
              disabled={loading}
              placeholder="Topic for the leaderboard (optional)"
              className="h-12 pl-9 text-base"
            />
          </div>
          <Button onClick={onSubmit} disabled={disabled} className="h-12 gap-2 px-6">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
                onClick={() => !loading && onBrandChange(domain)}
              >
                {domain}
              </Badge>
            ))}
          </div>
          {!pricesLoading && totalUsd > 0 && (
            <span className="text-xs text-muted-foreground">
              This run:{" "}
              <span className="font-medium text-foreground">${totalUsd.toFixed(2)}</span> USDC
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
