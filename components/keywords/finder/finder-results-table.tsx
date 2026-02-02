"use client";

import { memo } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { KeywordIdeaWithMeta } from "@/lib/api";

type SortField = "keyword" | "volume" | "kd" | "cpc" | "competition";
type SortDirection = "asc" | "desc";

interface FinderResultsTableProps {
  paginatedKeywords: KeywordIdeaWithMeta[];
  filteredCount: number;
  selectedKeywords: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  totalPages: number;
  onSort: (field: SortField) => void;
  onToggleKeyword: (keyword: string) => void;
  onToggleAll: () => void;
  onPageChange: (page: number) => void;
  onOpenSaveDialog: () => void;
}

const SortableHeader = memo(function SortableHeader({
  field,
  sortField,
  sortDirection,
  onSort,
  className: extraClassName,
  children,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-accent ${extraClassName || ""}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </TableHead>
  );
});

export const FinderResultsTable = memo(function FinderResultsTable({
  paginatedKeywords,
  filteredCount,
  selectedKeywords,
  sortField,
  sortDirection,
  currentPage,
  totalPages,
  onSort,
  onToggleKeyword,
  onToggleAll,
  onPageChange,
  onOpenSaveDialog,
}: FinderResultsTableProps) {
  const sortProps = { sortField, sortDirection, onSort };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Keywords ({filteredCount})</CardTitle>
            <CardDescription>
              Showing {paginatedKeywords.length} of {filteredCount} keywords
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            disabled={selectedKeywords.size === 0}
            onClick={onOpenSaveDialog}
          >
            <FolderPlus className="h-4 w-4" />
            Save to Folder ({selectedKeywords.size})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedKeywords.size === filteredCount && filteredCount > 0}
                  onCheckedChange={onToggleAll}
                />
              </TableHead>
              <SortableHeader field="keyword" className="w-[20%]" {...sortProps}>
                Keyword
              </SortableHeader>
              <SortableHeader field="volume" {...sortProps}>
                Volume
              </SortableHeader>
              <SortableHeader field="kd" {...sortProps}>
                KD%
              </SortableHeader>
              <SortableHeader field="cpc" {...sortProps}>
                <span className="hidden md:inline">CPC</span>
              </SortableHeader>
              <SortableHeader field="competition" {...sortProps}>
                <span className="hidden md:inline">Competition</span>
              </SortableHeader>
              <TableHead>Intent</TableHead>
              <TableHead className="hidden md:table-cell">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedKeywords.map((keyword) => (
              <TableRow key={keyword.keyword}>
                <TableCell>
                  <Checkbox
                    checked={selectedKeywords.has(keyword.keyword)}
                    onCheckedChange={() => onToggleKeyword(keyword.keyword)}
                  />
                </TableCell>
                <TableCell className="font-medium">{keyword.keyword}</TableCell>
                <TableCell>{keyword.volume.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={getKDColor(keyword.kd)}>{keyword.kd}%</span>
                </TableCell>
                <TableCell>${(keyword.cpc ?? 0).toFixed(2)}</TableCell>
                <TableCell>{(keyword.competition ?? 0).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={getIntentColor(keyword.intent || "Informational")}>
                    {keyword.intent || "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {keyword.trend && keyword.trend.length > 0 ? (
                    <TrendBars trend={keyword.trend} />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
