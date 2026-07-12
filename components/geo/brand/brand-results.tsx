"use client";

import { useState } from "react";
import { SegmentedTabs, type SegmentedTab } from "@/components/backlinks/segmented-tabs";
import { BrandMetricsCards } from "./brand-metrics-cards";
import { BrandLeaderboard } from "./brand-leaderboard";
import { MentionsTrend } from "./mentions-trend";
import type { BrandData } from "@/hooks/use-brand-visibility";

type TabValue = "leaderboard" | "trend";

interface BrandResultsProps {
  data: BrandData;
}

export function BrandResults({ data }: BrandResultsProps) {
  const [tab, setTab] = useState<TabValue>(data.brands.length > 0 ? "leaderboard" : "trend");

  const tabs: SegmentedTab<TabValue>[] = [
    { value: "leaderboard", label: "Competitors", count: data.brands.length },
    { value: "trend", label: "Gained / Lost", count: data.timeseries.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{data.target}</h2>
      </div>

      {data.metrics && <BrandMetricsCards metrics={data.metrics} />}

      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "leaderboard" ? (
        <BrandLeaderboard keyword={data.keyword} target={data.target} brands={data.brands} />
      ) : (
        <MentionsTrend timeseries={data.timeseries} />
      )}
    </div>
  );
}
