"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrafficHistoryItem {
  year: number;
  month: number;
  etv: number;
  keywords?: number;
}

interface DomainTrafficChartProps {
  trafficHistory: TrafficHistoryItem[];
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export const DomainTrafficChart = memo(function DomainTrafficChart({
  trafficHistory,
}: DomainTrafficChartProps) {
  const maxValue = useMemo(
    () => (trafficHistory.length ? Math.max(...trafficHistory.map((h) => h.etv)) : 0),
    [trafficHistory],
  );

  if (trafficHistory.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Trend</CardTitle>
        <CardDescription>Organic traffic over the last 12 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-48 items-end gap-1">
          {trafficHistory.map((item, index) => {
            const height = maxValue > 0 ? (item.etv / maxValue) * 100 : 0;
            const label = `${monthNames[item.month - 1]} ${item.year}`;
            return (
              <div
                key={`${item.year}-${item.month}`}
                className="flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full bg-indigo-600 rounded-t transition-all hover:bg-indigo-500"
                  style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
                  title={`${label}: ${formatNumber(item.etv)} visits`}
                />
                {index % 2 === 0 && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {monthNames[item.month - 1]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
