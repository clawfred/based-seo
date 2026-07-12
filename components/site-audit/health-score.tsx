import { Card, CardContent } from "@/components/ui/card";
import { scoreValue } from "./format";

interface HealthScoreProps {
  /** OnPage score 0–100, or null/undefined when the crawl didn't report one. */
  score: number | undefined | null;
  /** Short summary line, e.g. "3 critical issues across 20 pages". */
  caption: string;
}

interface Band {
  label: string;
  /** Tailwind text/stroke color for the ring and number. */
  color: string;
  ring: string;
}

function bandFor(score: number): Band {
  if (score >= 90)
    return { label: "Excellent", color: "text-emerald-500", ring: "stroke-emerald-500" };
  if (score >= 70) return { label: "Good", color: "text-lime-500", ring: "stroke-lime-500" };
  if (score >= 50)
    return { label: "Needs work", color: "text-amber-500", ring: "stroke-amber-500" };
  return { label: "Poor", color: "text-rose-500", ring: "stroke-rose-500" };
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function HealthScore({ score, caption }: HealthScoreProps) {
  const value = scoreValue(score);
  const band = value !== null ? bandFor(value) : null;
  const dash = value !== null ? (value / 100) * CIRCUMFERENCE : 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:justify-center sm:gap-10">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
            />
            {value !== null && band && (
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={band.ring}
                strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${band ? band.color : "text-muted-foreground"}`}>
              {value !== null ? value : "-"}
            </span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-medium text-muted-foreground">Health score</p>
          <h2 className={`text-2xl font-bold ${band ? band.color : ""}`}>
            {band ? band.label : "No score reported"}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">{caption}</p>
        </div>
      </CardContent>
    </Card>
  );
}
