"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface AnchorData {
  anchor: string;
  backlinks: number;
  percentage: number;
}

interface AnchorDistributionChartProps {
  anchors: AnchorData[];
}

export const AnchorDistributionChart = memo(function AnchorDistributionChart({
  anchors,
}: AnchorDistributionChartProps) {
  const maxPercentage = useMemo(
    () => (anchors.length ? Math.max(...anchors.map((a) => a.percentage)) : 0),
    [anchors],
  );

  if (anchors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Anchor Text</CardTitle>
          <CardDescription>Most common anchor text used in backlinks</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No anchor data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Anchor Text</CardTitle>
        <CardDescription>Most common anchor text used in backlinks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {anchors.map((anchor, index) => {
            const barWidth = maxPercentage > 0 ? (anchor.percentage / maxPercentage) * 100 : 0;
            return (
              <div key={`anchor-${index}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[200px] font-medium" title={anchor.anchor}>
                    {anchor.anchor}
                  </span>
                  <span className="text-muted-foreground ml-2 shrink-0">
                    {anchor.backlinks.toLocaleString()} ({anchor.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted">
                  <div
                    className="h-3 rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
