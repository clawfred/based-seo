import { MessageSquareQuote, Quote, Gauge, Percent, Bot, Hash } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { num, type Row } from "../geo-extract";
import { formatCount, formatPercent, humanizeKey } from "../geo-format";

interface BrandMetricsCardsProps {
  metrics: Row;
}

interface MetricDef {
  label: string;
  keys: string[];
  kind: "count" | "percent";
  icon: LucideIcon;
}

/**
 * Preferred metrics, tried in order. The AI-mentions payload shape isn't tightly
 * documented, so each probes several candidate keys and we render whatever
 * resolves — topping up with any other numeric fields so the grid is never bare.
 */
const METRICS: MetricDef[] = [
  {
    label: "Mentions",
    keys: ["mentions_count", "mentions", "total_mentions"],
    kind: "count",
    icon: MessageSquareQuote,
  },
  {
    label: "Citations",
    keys: ["citations_count", "citations", "total_citations"],
    kind: "count",
    icon: Quote,
  },
  {
    label: "Prompts",
    keys: ["prompts_count", "prompts", "total_prompts", "queries_count"],
    kind: "count",
    icon: Hash,
  },
  {
    label: "Mention Rate",
    keys: ["mention_rate", "visibility", "share_of_voice", "visibility_score"],
    kind: "percent",
    icon: Percent,
  },
  { label: "Avg. Rank", keys: ["average_rank", "avg_rank", "rank"], kind: "count", icon: Gauge },
  { label: "Models", keys: ["models_count", "llm_models_count"], kind: "count", icon: Bot },
];

interface ResolvedStat {
  label: string;
  value: string;
  icon: LucideIcon;
}

export function BrandMetricsCards({ metrics }: BrandMetricsCardsProps) {
  const stats: ResolvedStat[] = [];
  const used = new Set<string>();

  for (const def of METRICS) {
    const value = num(metrics, def.keys);
    if (value === undefined) continue;
    def.keys.forEach((k) => used.add(k));
    stats.push({
      label: def.label,
      value: def.kind === "percent" ? formatPercent(value) : formatCount(value),
      icon: def.icon,
    });
  }

  // Top up from any remaining numeric fields so the row stays substantial.
  for (const [key, value] of Object.entries(metrics)) {
    if (stats.length >= 6) break;
    if (used.has(key) || typeof value !== "number" || !Number.isFinite(value)) continue;
    used.add(key);
    stats.push({ label: humanizeKey(key), value: formatCount(value), icon: Hash });
  }

  if (stats.length === 0) return null;

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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
