"use client";

import { useMemo, useState } from "react";
import { SegmentedTabs, type SegmentedTab } from "@/components/backlinks/segmented-tabs";
import { HealthScore } from "./health-score";
import { IssueStatCards } from "./issue-stat-cards";
import { IssuesTab } from "./issues-tab";
import { PagesTab } from "./pages-tab";
import { LinksTab } from "./links-tab";
import { extractIssues, countBySeverity } from "./extract";
import { hostOf } from "./format";
import type { AuditData } from "./audit-types";

type TabValue = "issues" | "pages" | "links";

interface AuditResultsProps {
  data: AuditData;
}

/** Build the health-score caption from severity counts and page total. */
function buildCaption(critical: number, warning: number, pages: number): string {
  const parts: string[] = [];
  if (critical > 0) parts.push(`${critical} critical`);
  if (warning > 0) parts.push(`${warning} warning${warning === 1 ? "" : "s"}`);
  const issuesLabel = parts.length > 0 ? parts.join(", ") : "no major issues";
  const pagesLabel =
    pages > 0 ? ` across ${pages.toLocaleString()} page${pages === 1 ? "" : "s"}` : "";
  return `${issuesLabel}${pagesLabel}.`;
}

export function AuditResults({ data }: AuditResultsProps) {
  const [tab, setTab] = useState<TabValue>("issues");

  const issues = useMemo(() => extractIssues(data.summary), [data.summary]);
  const severity = useMemo(() => countBySeverity(issues), [issues]);

  const pageCount = data.pages.length || data.summary?.crawl_status?.pages_crawled || 0;
  const caption = buildCaption(severity.critical, severity.warning, pageCount);

  const tabs: SegmentedTab<TabValue>[] = [
    { value: "issues", label: "Issues", count: issues.length },
    { value: "pages", label: "Pages", count: data.pages.length },
    { value: "links", label: "Links", count: data.links.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{hostOf(data.target)}</h2>
      </div>

      <HealthScore score={data.summary?.page_metrics?.onpage_score} caption={caption} />

      <IssueStatCards summary={data.summary} />

      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "issues" && <IssuesTab issues={issues} />}
      {tab === "pages" && <PagesTab pages={data.pages} />}
      {tab === "links" && <LinksTab links={data.links} />}
    </div>
  );
}
