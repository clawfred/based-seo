"use client";

import { useState } from "react";
import { BacklinksSummaryMetrics } from "./backlinks-summary-metrics";
import { ReferringDomainsTable } from "./referring-domains-table";
import { BacklinksTable } from "./backlinks-table";
import { SegmentedTabs, type SegmentedTab } from "./segmented-tabs";
import type { BacklinksData } from "@/hooks/use-backlinks-query";

type TabValue = "domains" | "backlinks";

interface BacklinksResultsProps {
  data: BacklinksData;
}

export function BacklinksResults({ data }: BacklinksResultsProps) {
  const [tab, setTab] = useState<TabValue>("domains");

  const tabs: SegmentedTab<TabValue>[] = [
    { value: "domains", label: "Referring Domains", count: data.referringDomains.length },
    { value: "backlinks", label: "Backlinks", count: data.backlinks.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">{data.target}</h2>
      </div>

      {data.summary && <BacklinksSummaryMetrics summary={data.summary} />}

      <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "domains" ? (
        <ReferringDomainsTable domains={data.referringDomains} />
      ) : (
        <BacklinksTable backlinks={data.backlinks} />
      )}
    </div>
  );
}
