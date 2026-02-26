"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReferringDomainsBreakdownProps {
  breakdown: Record<string, number>;
}

const colorMap: Record<string, string> = {
  Blogs: "bg-blue-500",
  News: "bg-purple-500",
  "E-commerce": "bg-green-500",
  Forums: "bg-orange-500",
  Social: "bg-pink-500",
  Wiki: "bg-cyan-500",
  Other: "bg-gray-500",
};

export const ReferringDomainsBreakdown = memo(function ReferringDomainsBreakdown({
  breakdown,
}: ReferringDomainsBreakdownProps) {
  const entries = useMemo(() => {
    return Object.entries(breakdown)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [breakdown]);

  const total = useMemo(() => entries.reduce((sum, e) => sum + e.count, 0), [entries]);
  const maxCount = useMemo(
    () => (entries.length ? Math.max(...entries.map((e) => e.count)) : 0),
    [entries],
  );

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referring Domains by Type</CardTitle>
          <CardDescription>Distribution of linking domains by platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No breakdown data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referring Domains by Type</CardTitle>
        <CardDescription>Distribution of linking domains by platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map(({ type, count }) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const barColor = colorMap[type] || colorMap.Other;
            
            return (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${barColor} text-white`}>
                      {type}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground ml-2 shrink-0">
                    {count.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted">
                  <div
                    className={`h-3 rounded-full ${barColor} transition-all duration-300`}
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
