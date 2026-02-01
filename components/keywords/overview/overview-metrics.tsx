import { TrendingUp, DollarSign, Target, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getKDColor, getIntentColor } from "@/lib/keyword-utils";
import type { KeywordMetrics } from "@/lib/types";

interface OverviewMetricsProps {
  results: KeywordMetrics;
  locationName: string;
}

export function OverviewMetrics({ results, locationName }: OverviewMetricsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Volume</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{results.volume.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Monthly searches in {locationName}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Keyword Difficulty</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className={`text-2xl font-bold ${getKDColor(results.kd)}`}>{results.kd}%</div>
          <Progress value={results.kd} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPC</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${results.cpc.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Cost per click</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Intent & Competition</CardTitle>
          <Info className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge className={getIntentColor(results.intent)}>{results.intent}</Badge>
          <p className="text-xs text-muted-foreground">
            Competition: {results.competition.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
