import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { num, str, type Row } from "../geo-extract";
import { formatCount } from "../geo-format";

interface MentionsTrendProps {
  timeseries: Row[];
}

const DATE_KEYS = ["date", "period", "datetime", "year_month", "timestamp"];
const NEW_KEYS = ["new", "new_mentions", "gained", "new_count", "added"];
const LOST_KEYS = ["lost", "lost_mentions", "lost_count", "removed"];

interface Point {
  label: string;
  gained: number;
  lost: number;
}

/**
 * A dependency-free dual bar chart of mentions gained vs lost per period.
 * Both strips share one scale so the two series read against each other.
 */
export function MentionsTrend({ timeseries }: MentionsTrendProps) {
  const points: Point[] = timeseries.map((row) => ({
    label: str(row, DATE_KEYS) ?? "",
    gained: num(row, NEW_KEYS) ?? 0,
    lost: num(row, LOST_KEYS) ?? 0,
  }));

  const totalGained = points.reduce((s, p) => s + p.gained, 0);
  const totalLost = points.reduce((s, p) => s + p.lost, 0);
  const net = totalGained - totalLost;
  const max = Math.max(1, ...points.map((p) => Math.max(p.gained, p.lost)));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Mentions gained vs lost</CardTitle>
            <CardDescription>New and lost AI mentions across recent periods</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-emerald-500">
              <TrendingUp className="h-3 w-3" /> {formatCount(totalGained)} gained
            </Badge>
            <Badge variant="outline" className="gap-1 text-rose-500">
              <TrendingDown className="h-3 w-3" /> {formatCount(totalLost)} lost
            </Badge>
            <Badge variant={net >= 0 ? "default" : "destructive"}>
              Net {net >= 0 ? "+" : ""}
              {formatCount(net)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No trend data available.</p>
        ) : (
          <div className="space-y-4">
            <Strip points={points} max={max} tone="gained" />
            <Strip points={points} max={max} tone="lost" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Strip({ points, max, tone }: { points: Point[]; max: number; tone: "gained" | "lost" }) {
  const color = tone === "gained" ? "bg-emerald-500" : "bg-rose-500";
  const label = tone === "gained" ? "Gained" : "Lost";
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-16 items-end gap-1">
        {points.map((p, i) => {
          const value = tone === "gained" ? p.gained : p.lost;
          const height = (value / max) * 100;
          return (
            <div
              key={`${tone}-${p.label}-${i}`}
              className="group relative flex-1"
              title={`${p.label || `#${i + 1}`}: ${value}`}
            >
              <div
                className={`${color} w-full rounded-t transition-all`}
                style={{ height: `${Math.max(height, value > 0 ? 4 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
