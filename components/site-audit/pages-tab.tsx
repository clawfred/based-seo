import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prettyUrl, formatMs, scoreValue } from "./format";
import type { AuditPage, ChecksMap } from "./audit-types";

interface PagesTabProps {
  pages: AuditPage[];
}

/** Count how many per-page checks are currently tripped (truthy). */
function issueCount(checks: ChecksMap | undefined): number {
  if (!checks) return 0;
  let n = 0;
  for (const v of Object.values(checks)) {
    if (v === true || (typeof v === "number" && v > 0)) n += 1;
  }
  return n;
}

function statusVariant(code: number | undefined): "default" | "secondary" | "destructive" {
  if (code === undefined) return "secondary";
  if (code >= 500 || code >= 400) return "destructive";
  if (code >= 300) return "secondary";
  return "default";
}

function scoreClass(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-500";
  if (score >= 70) return "text-lime-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

export function PagesTab({ pages }: PagesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crawled pages</CardTitle>
        <CardDescription>
          {pages.length > 0
            ? `${pages.length.toLocaleString()} pages crawled, ranked with per-page scores and issues`
            : "No pages returned"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="hidden max-w-xs md:table-cell">Title</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Issues</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Load</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page, i) => {
                  const score = scoreValue(page.onpage_score);
                  const issues = issueCount(page.checks);
                  return (
                    <TableRow key={`${page.url ?? "page"}-${i}`}>
                      <TableCell className="max-w-xs truncate">
                        {page.url ? (
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                          >
                            {prettyUrl(page.url)}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                        {page.meta?.title || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariant(page.status_code)}>
                          {page.status_code ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${scoreClass(score)}`}>
                        {score ?? "-"}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {issues > 0 ? (
                          <span className="text-amber-500">{issues}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                        {formatMs(page.page_timing?.time_to_interactive)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
