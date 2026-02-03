"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKDColor, getIntentColor } from "@/lib/keyword-utils";
import { TrendBars } from "@/components/shared/trend-bars";
import type { KeywordMetrics } from "@/lib/types";

interface OverviewResultsTableProps {
  results: Array<KeywordMetrics>;
  errors: Map<string, string>;
  onSelectKeyword: (keyword: string) => void;
}

export const OverviewResultsTable = memo(function OverviewResultsTable({
  results,
  errors,
  onSelectKeyword,
}: OverviewResultsTableProps) {
  const errorEntries = Array.from(errors.entries());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keywords ({results.length + errorEntries.length})</CardTitle>
        <CardDescription>Click a row to see detailed metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Keyword</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>KD%</TableHead>
              <TableHead className="hidden md:table-cell">CPC</TableHead>
              <TableHead className="hidden md:table-cell">Competition</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead className="hidden md:table-cell">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((row) => (
              <TableRow
                key={row.keyword}
                className="cursor-pointer"
                onClick={() => onSelectKeyword(row.keyword)}
              >
                <TableCell className="font-medium">{row.keyword}</TableCell>
                <TableCell>{row.volume.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={getKDColor(row.kd)}>{row.kd}%</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">${row.cpc.toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">{row.competition.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={getIntentColor(row.intent)}>{row.intent}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.trend && row.trend.length > 0 ? (
                    <TrendBars trend={row.trend} />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {errorEntries.map(([keyword, errorMsg]) => (
              <TableRow key={keyword} className="opacity-60">
                <TableCell className="font-medium">{keyword}</TableCell>
                <TableCell colSpan={6}>
                  <span className="text-sm text-muted-foreground">{errorMsg}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
