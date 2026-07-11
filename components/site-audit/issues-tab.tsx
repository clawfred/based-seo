import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "./severity-badge";
import { CATEGORY_ORDER, type IssueCategory } from "./checks-catalog";
import type { DerivedIssue } from "./extract";

interface IssuesTabProps {
  issues: DerivedIssue[];
}

export function IssuesTab({ issues }: IssuesTabProps) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <h3 className="text-lg font-semibold">No issues detected</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            The crawler didn&apos;t flag any of the technical SEO checks we track. Try crawling more
            pages for deeper coverage.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Bucket issues by category, preserving the severity-sorted order within each.
  const byCategory = new Map<IssueCategory, DerivedIssue[]>();
  for (const issue of issues) {
    const list = byCategory.get(issue.category) ?? [];
    list.push(issue);
    byCategory.set(issue.category, list);
  }

  const categories = CATEGORY_ORDER.filter((c) => byCategory.has(c));

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const list = byCategory.get(category) ?? [];
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{category}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {list.length} {list.length === 1 ? "issue" : "issues"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {list.map((issue) => (
                <div
                  key={issue.key}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-sm font-medium">{issue.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold tabular-nums">
                      {issue.count.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {issue.count === 1 ? "page" : "pages"}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
