import { KeyRound, TrendingUp, DollarSign, Globe, Link2, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInt, formatCompact, formatMoney } from "./format";
import type { OverviewStats } from "./domain-types";

interface OverviewStatsProps {
  stats: OverviewStats;
}

interface Stat {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export function OverviewStatsCards({ stats }: OverviewStatsProps) {
  const cards: Stat[] = [
    { label: "Organic Keywords", value: formatCompact(stats.organicKeywords), icon: KeyRound },
    {
      label: "Organic Traffic",
      value: formatCompact(stats.organicTraffic),
      hint: "est. monthly visits",
      icon: TrendingUp,
    },
    { label: "Traffic Value", value: formatMoney(stats.trafficValue), hint: "per month", icon: DollarSign },
    { label: "Referring Domains", value: formatCompact(stats.referringDomains), icon: Globe },
    { label: "Backlinks", value: formatCompact(stats.backlinks), icon: Link2 },
    {
      label: "Domain Rank",
      value: stats.domainRank !== undefined ? formatInt(stats.domainRank) : "—",
      hint: "0–1000",
      icon: Gauge,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((stat) => (
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
