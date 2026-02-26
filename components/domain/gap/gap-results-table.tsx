"use client";

import { memo } from "react";
import { FolderPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getKDColor } from "@/lib/keyword-utils";
import type { KeywordGapItem } from "@/lib/api";

type SortField = "keyword" | "yourPosition" | "volume" | "kd" | "trafficPotential";
type SortDirection = "asc" | "desc";

interface GapResultsTableProps {
  paginatedKeywords: KeywordGapItem[];
  filteredCount: number;
  selectedKeywords: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  totalPages: number;
  competitors: string[];
  onSort: (field: SortField) => void;
  onToggleKeyword: (keyword: string) => void;
  onToggleAll: () => void;
  onPageChange: (page: number) => void;
  onOpenSaveDialog: () => void;
  onExportCSV: () => void;
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

function formatPosition(pos: number | null): string {
  if (pos === null) return "—";
  return pos.toString();
}

function getPositionColor(pos: number | null): string {
  if (pos === null) return "text-muted-foreground";
  if (pos <= 3) return "text-green-600 font-semibold";
  if (pos <= 10) return "text-green-500";
  if (pos <= 20) return "text-yellow-500";
  if (pos <= 50) return "text-orange-500";
  return "text-red-500";
}

export const GapResultsTable = memo(function GapResultsTable({
  paginatedKeywords,
  filteredCount,
  selectedKeywords,
  sortField,
  sortDirection,
  currentPage,
  totalPages,
  competitors,
  onSort,
  onToggleKeyword,
  onToggleAll,
  onPageChange,
  onOpenSaveDialog,
  onExportCSV,
}: GapResultsTableProps) {
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={onExportCSV}
              disabled={filteredCount === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={selectedKeywords.size === 0}
              onClick={onOpenSaveDialog}
            >
              <FolderPlus className="h-4 w-4" />
              Save ({selectedKeywords.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedKeywords.size === filteredCount && filteredCount > 0}
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
                <SortableHeader field="keyword" className="min-w-[200px]" {...sortProps}>
                  Keyword
                </SortableHeader>
                <SortableHeader field="yourPosition" {...sortProps}>
                  Your Pos
                </SortableHeader>
                {competitors.map((comp) => (
                  <TableHead key={comp} className="text-center">
                    <span className="truncate max-w-[100px] block" title={comp}>
                      {comp.length > 15 ? comp.slice(0, 12) + "..." : comp}
                    </span>
                  </TableHead>
                ))}
                <SortableHeader field="volume" {...sortProps}>
                  Volume
                </SortableHeader>
                <SortableHeader field="kd" {...sortProps}>
                  KD%
                </SortableHeader>
                <SortableHeader field="trafficPotential" {...sortProps}>
                  Traffic Pot.
                </SortableHeader>
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
                  <TableCell className={getPositionColor(keyword.yourPosition)}>
                    {formatPosition(keyword.yourPosition)}
                  </TableCell>
                  {competitors.map((comp) => (
                    <TableCell
                      key={comp}
                      className={`text-center ${getPositionColor(keyword.competitorPositions[comp])}`}
                    >
                      {formatPosition(keyword.competitorPositions[comp])}
                    </TableCell>
                  ))}
                  <TableCell>{keyword.volume.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={getKDColor(keyword.kd)}>{keyword.kd}%</span>
                  </TableCell>
                  <TableCell>{keyword.trafficPotential.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
