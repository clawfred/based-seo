import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendChartProps {
  trend: number[];
}

export const TrendChart = memo(function TrendChart({ trend }: TrendChartProps) {
  const maxValue = useMemo(() => (trend.length ? Math.max(...trend) : 0), [trend]);

  if (trend.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>12-Month Trend</CardTitle>
        <CardDescription>Search volume over the last year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-end gap-2">
          {trend.map((value, index) => {
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div
                key={`month-${index}`}
                className="flex-1 bg-indigo-600 rounded-t"
                style={{ height: `${height}%` }}
                title={value.toLocaleString()}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
