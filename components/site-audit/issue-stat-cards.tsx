import { Unlink, FileX2, Copy, ImageOff, Globe, Link as LinkIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCount } from "./format";
import type { AuditSummary, ChecksMap } from "./audit-types";

interface IssueStatCardsProps {
  summary: AuditSummary | null;
}

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
}

/** Read a numeric check/metric defensively (booleans count as 1). */
function num(map: ChecksMap | undefined, key: string): number | undefined {
  const v = map?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v === true) return 1;
  return undefined;
}

export function IssueStatCards({ summary }: IssueStatCardsProps) {
  const metrics = summary?.page_metrics;
  const checks = metrics?.checks;

  const stats: Stat[] = [
    { label: "Broken links", value: formatCount(metrics?.broken_links), icon: Unlink },
    { label: "Broken resources", value: formatCount(metrics?.broken_resources), icon: FileX2 },
    { label: "Duplicate titles", value: formatCount(metrics?.duplicate_title), icon: Copy },
    {
      label: "Missing descriptions",
      value: formatCount(num(checks, "no_description")),
      icon: FileX2,
    },
    { label: "Images w/o alt", value: formatCount(num(checks, "no_image_alt")), icon: ImageOff },
    { label: "Internal links", value: formatCount(metrics?.links_internal), icon: LinkIcon },
    { label: "External links", value: formatCount(metrics?.links_external), icon: Globe },
    {
      label: "Non-indexable",
      value: formatCount(metrics?.non_indexable),
      icon: FileX2,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
