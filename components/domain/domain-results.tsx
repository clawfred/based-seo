"use client";

import { useState } from "react";
import { SegmentedTabs, type SegmentedTab } from "@/components/backlinks/segmented-tabs";
import { OverviewStatsCards } from "./overview-stats";
import { KeywordsTable } from "./keywords-table";
import { CompetitorsTable } from "./competitors-table";
import { TechStack } from "./tech-stack";
import type { DomainReport } from "./domain-types";

type TabValue = "overview" | "keywords" | "competitors" | "tech";

interface DomainResultsProps {
  report: DomainReport;
}

export function DomainResults({ report }: DomainResultsProps) {
  const [tab, setTab] = useState<TabValue>("overview");

  const techCount = report.technologies.reduce((sum, c) => sum + c.items.length, 0);

  const tabs: SegmentedTab<TabValue>[] = [
    { value: "overview", label: "Overview" },
    { value: "keywords", label: "Top Keywords", count: report.keywords.length },
    { value: "competitors", label: "Competitors", count: report.competitors.length },
    { value: "tech", label: "Tech Stack", count: techCount },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{report.target}</h2>

      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "overview" &&
        (report.overview ? (
          <OverviewStatsCards stats={report.overview} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No overview data available for this domain.
          </p>
        ))}
      {tab === "keywords" && <KeywordsTable keywords={report.keywords} />}
      {tab === "competitors" && <CompetitorsTable competitors={report.competitors} />}
      {tab === "tech" && <TechStack technologies={report.technologies} />}
    </div>
  );
}
