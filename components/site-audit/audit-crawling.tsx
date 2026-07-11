import { Loader2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { extractProgress } from "./extract";
import { hostOf } from "./format";
import type { AuditSummary } from "./audit-types";

interface AuditCrawlingProps {
  target: string;
  summary: AuditSummary | null;
  /** Which poll we're on, so the user sees liveness before counts arrive. */
  pollCount: number;
}

export function AuditCrawling({ target, summary, pollCount }: AuditCrawlingProps) {
  const { pagesCrawled, maxPages, inQueue, percent } = extractProgress(summary);
  const host = hostOf(target);

  // Before the first counts arrive, show a gentle indeterminate bar rather than 0%.
  const hasCounts = pagesCrawled > 0 || maxPages > 0 || inQueue > 0;
  const barValue = hasCounts ? percent : Math.min(90, pollCount * 8);

  return (
    <Card>
      <CardContent className="space-y-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
            <Globe className="h-7 w-7 text-indigo-500" />
            <Loader2 className="absolute inset-0 m-auto h-14 w-14 animate-spin text-indigo-500/40" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Crawling {host}…</h2>
            <p className="text-sm text-muted-foreground">
              {hasCounts
                ? `Crawled ${pagesCrawled.toLocaleString()}${
                    maxPages > 0 ? ` of ${maxPages.toLocaleString()}` : ""
                  } pages${inQueue > 0 ? ` · ${inQueue.toLocaleString()} in queue` : ""}`
                : "Starting the crawler and fetching the first pages…"}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-md space-y-2">
          <Progress value={barValue} />
          <p className="text-center text-xs text-muted-foreground">
            This can take up to a minute. The report loads automatically when the crawl finishes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
