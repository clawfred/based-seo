import { Link2, Globe, Gauge, Unlink, ShieldAlert, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount } from "./format";
import type { BacklinkSummary } from "./backlinks-types";

interface BacklinksSummaryMetricsProps {
  summary: BacklinkSummary;
}

interface Stat {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export function BacklinksSummaryMetrics({ summary }: BacklinksSummaryMetricsProps) {
  const stats: Stat[] = [
    { label: "Total Backlinks", value: formatCount(summary.backlinks), icon: Link2 },
    { label: "Referring Domains", value: formatCount(summary.referring_domains), icon: Globe },
    {
      label: "Domain Rank",
      value: summary.rank !== undefined ? String(summary.rank) : "—",
      hint: "0–1000",
      icon: Gauge,
    },
    { label: "Broken Backlinks", value: formatCount(summary.broken_backlinks), icon: Unlink },
    {
      label: "Spam Score",
      value: summary.backlinks_spam_score !== undefined ? `${summary.backlinks_spam_score}%` : "—",
      icon: ShieldAlert,
    },
    { label: "Referring Pages", value: formatCount(summary.referring_pages), icon: FileText },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.hint && <p className="text-xs text-muted-foreground">{stat.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
