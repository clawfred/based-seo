"use client";

import { memo } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TopKeyword {
  keyword: string;
  position: number;
  volume: number;
  trafficShare: number;
  cpc?: number;
  difficulty?: number;
  url?: string;
}

interface TopKeywordsTableProps {
  keywords: TopKeyword[];
  domain: string;
}

function getPositionColor(position: number): string {
  if (position <= 3) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (position <= 10) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  if (position <= 20)
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

export const TopKeywordsTable = memo(function TopKeywordsTable({
  keywords,
  domain,
}: TopKeywordsTableProps) {
  if (keywords.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Organic Keywords</CardTitle>
        <CardDescription>Keywords driving the most traffic to {domain}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Traffic %</TableHead>
                {keywords.some((k) => k.cpc) && <TableHead className="text-right">CPC</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords.map((keyword, index) => (
                <TableRow key={`${keyword.keyword}-${index}`}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary flex items-center gap-1"
                    >
                      {keyword.keyword}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={getPositionColor(keyword.position)}>
                      #{keyword.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(keyword.volume)}</TableCell>
                  <TableCell className="text-right">{keyword.trafficShare.toFixed(1)}%</TableCell>
                  {keywords.some((k) => k.cpc) && (
                    <TableCell className="text-right">
                      {keyword.cpc ? `$${keyword.cpc.toFixed(2)}` : "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});
