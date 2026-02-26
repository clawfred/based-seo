"use client";

import { useState, useEffect, memo, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Flame,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendDataPoint {
  date: string;
  values: Record<string, number>;
}

interface TrendsData {
  trendLine: TrendDataPoint[];
  interestByRegion: { region: string; value: number }[];
  risingQueries: { query: string; value: number }[];
  topQueries: { query: string; value: number }[];
}

interface GoogleTrendsSectionProps {
  keywords: string[];
  locationCode?: string;
}

const TREND_COLORS = [
  "bg-indigo-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-cyan-500",
];

const TREND_COLOR_VALUES = [
  "#6366f1",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
];

function calculateTrendBadge(
  trendLine: TrendDataPoint[],
  keyword: string
): { label: string; icon: React.ReactNode; className: string } {
  if (trendLine.length < 12) {
    return {
      label: "Stable",
      icon: <ArrowRight className="h-3 w-3" />,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
  }

  // Compare last 3 months to previous 3 months
  const recent = trendLine.slice(-3);
  const previous = trendLine.slice(-6, -3);

  const recentAvg =
    recent.reduce((sum, dp) => sum + (dp.values[keyword] || 0), 0) / recent.length;
  const previousAvg =
    previous.reduce((sum, dp) => sum + (dp.values[keyword] || 0), 0) / previous.length;

  if (previousAvg === 0) {
    return {
      label: "Stable",
      icon: <ArrowRight className="h-3 w-3" />,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
  }

  const growthRate = ((recentAvg - previousAvg) / previousAvg) * 100;

  if (growthRate > 50) {
    return {
      label: "Trending",
      icon: <Flame className="h-3 w-3" />,
      className: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    };
  } else if (growthRate > 20) {
    return {
      label: "Rising",
      icon: <ArrowUpRight className="h-3 w-3" />,
      className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    };
  } else if (growthRate < -20) {
    return {
      label: "Declining",
      icon: <ArrowDownRight className="h-3 w-3" />,
      className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };
  } else {
    return {
      label: "Stable",
      icon: <ArrowRight className="h-3 w-3" />,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    };
  }
}

function TrendBadge({
  trendLine,
  keyword,
}: {
  trendLine: TrendDataPoint[];
  keyword: string;
}) {
  const badge = calculateTrendBadge(trendLine, keyword);
  return (
    <Badge variant="secondary" className={`gap-1 ${badge.className}`}>
      {badge.icon}
      {badge.label}
    </Badge>
  );
}

function RegionBarList({
  regions,
}: {
  regions: { region: string; value: number }[];
}) {
  const maxValue = Math.max(...regions.map((r) => r.value), 1);

  return (
    <div className="space-y-3">
      {regions.map((region) => (
        <div key={region.region} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{region.region}</span>
            <span className="text-muted-foreground">{region.value}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${(region.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function QueryList({
  queries,
  title,
  isRising = false,
}: {
  queries: { query: string; value: number }[];
  title: string;
  isRising?: boolean;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      {queries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data available</p>
      ) : (
        <ul className="space-y-1.5">
          {queries.map((q) => (
            <li key={q.query} className="flex items-center justify-between text-sm">
              <span className="truncate mr-2">{q.query}</span>
              <span className="text-muted-foreground shrink-0">
                {isRising ? `+${q.value}%` : q.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Simple SVG line chart component
function SimpleLineChart({
  data,
  keywords,
}: {
  data: TrendDataPoint[];
  keywords: string[];
}) {
  // Sample data to reduce points (every 3rd month for 5 years = ~20 points)
  const sampledData = useMemo(() => {
    return data.filter((_, i) => i % 3 === 0 || i === data.length - 1);
  }, [data]);

  if (sampledData.length < 2) return null;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value
  const maxValue = Math.max(
    ...sampledData.flatMap((dp) => keywords.map((kw) => dp.values[kw] || 0)),
    1
  );

  // Generate paths for each keyword
  const paths = keywords.map((kw, kwIndex) => {
    const points = sampledData.map((dp, i) => {
      const x = padding.left + (i / (sampledData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((dp.values[kw] || 0) / maxValue) * chartHeight;
      return `${x},${y}`;
    });
    return {
      keyword: kw,
      path: `M ${points.join(" L ")}`,
      color: TREND_COLOR_VALUES[kwIndex % TREND_COLOR_VALUES.length],
    };
  });

  // Generate year labels
  const years = new Set<string>();
  const yearPositions: { year: string; x: number }[] = [];
  sampledData.forEach((dp, i) => {
    const year = dp.date.slice(0, 4);
    if (!years.has(year)) {
      years.add(year);
      yearPositions.push({
        year,
        x: padding.left + (i / (sampledData.length - 1)) * chartWidth,
      });
    }
  });

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padding.top + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="stroke-muted"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                className="fill-muted-foreground text-[10px]"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Year labels */}
        {yearPositions.map(({ year, x }) => (
          <text
            key={year}
            x={x}
            y={height - 10}
            className="fill-muted-foreground text-[10px]"
            textAnchor="middle"
          >
            {year}
          </text>
        ))}

        {/* Lines */}
        {paths.map(({ keyword, path, color }) => (
          <path
            key={keyword}
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        {keywords.map((kw, idx) => (
          <div key={kw} className="flex items-center gap-2 text-sm">
            <span
              className={`w-3 h-3 rounded-full ${TREND_COLORS[idx % TREND_COLORS.length]}`}
            />
            <span className="text-muted-foreground">{kw}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const GoogleTrendsSection = memo(function GoogleTrendsSection({
  keywords,
  locationCode = "US",
}: GoogleTrendsSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendsData | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (keywords.length === 0) return;

    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      setWarning(null);

      try {
        const response = await fetch("/api/keywords/trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keywords,
            geo: locationCode,
            timeRange: "5y",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch trends");
        }

        const result = await response.json();
        if (result.warning) {
          setWarning(result.warning);
        }
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch trends");
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [keywords, locationCode]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <CardTitle>Google Trends</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </Button>
        </div>
        <CardDescription>5-year search interest trends from Google</CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading trends data...
              </div>
              <Skeleton className="h-52 w-full" />
              <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {warning && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-600 dark:text-yellow-400">
              {warning}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Trend Badges */}
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <div key={kw} className="flex items-center gap-2">
                    <span className="text-sm font-medium">{kw}:</span>
                    <TrendBadge trendLine={data.trendLine} keyword={kw} />
                  </div>
                ))}
              </div>

              {/* 5-Year Trend Line Chart */}
              {data.trendLine.length > 0 && (
                <SimpleLineChart data={data.trendLine} keywords={keywords} />
              )}

              {/* Interest by Region & Related Queries */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Interest by Region */}
                <div className="space-y-3">
                  <h4 className="font-medium">Interest by Region</h4>
                  {data.interestByRegion.length > 0 ? (
                    <RegionBarList regions={data.interestByRegion} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No regional data available</p>
                  )}
                </div>

                {/* Related Queries */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <QueryList
                    queries={data.risingQueries}
                    title="🔥 Rising Queries"
                    isRising
                  />
                  <QueryList queries={data.topQueries} title="🔝 Top Queries" />
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
});
