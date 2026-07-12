"use client";

import { Search, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CRAWL_PAGE_OPTIONS, EXAMPLE_DOMAINS } from "./constants";
import { formatUsd } from "./format";

interface AuditSearchProps {
  value: string;
  onChange: (value: string) => void;
  pages: number;
  onPagesChange: (pages: number) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Estimated crawl cost for the selected page count. */
  estimateUsd: number;
  priceLoading: boolean;
}

export function AuditSearch({
  value,
  onChange,
  pages,
  onPagesChange,
  onSubmit,
  loading,
  estimateUsd,
  priceLoading,
}: AuditSearchProps) {
  const disabled = loading || value.trim().length === 0;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) onSubmit();
              }}
              disabled={loading}
              placeholder="Enter a site to audit, e.g. example.com"
              className="h-12 pl-9 text-base"
              autoFocus
            />
          </div>

          <Select
            value={String(pages)}
            onValueChange={(v) => onPagesChange(Number(v))}
            disabled={loading}
          >
            <SelectTrigger className="h-12 w-full sm:w-[150px]" aria-label="Pages to crawl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CRAWL_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} pages
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={onSubmit} disabled={disabled} className="h-12 gap-2 px-6">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Run audit
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {EXAMPLE_DOMAINS.map((domain) => (
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
          {!priceLoading && estimateUsd > 0 && (
            <span className="text-xs text-muted-foreground">
              Crawl estimate:{" "}
              <span className="font-medium text-foreground">{formatUsd(estimateUsd)}</span> USDC ·{" "}
              {pages} pages
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
