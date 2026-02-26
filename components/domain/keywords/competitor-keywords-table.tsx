"use client";

import { memo } from "react";
import { FolderPlus, Download } from "lucide-react";
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
import type { CompetitorKeyword } from "@/app/api/domain/keywords/route";

type SortField = "keyword" | "position" | "volume" | "traffic" | "kd" | "cpc";
type SortDirection = "asc" | "desc";

interface CompetitorKeywordsTableProps {
  paginatedKeywords: CompetitorKeyword[];
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
  onExportCsv: () => void;
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

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

export const CompetitorKeywordsTable = memo(function CompetitorKeywordsTable({
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
  onExportCsv,
}: CompetitorKeywordsTableProps) {
  const sortProps = { sortField, sortDirection, onSort };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ranked Keywords ({filteredCount})</CardTitle>
            <CardDescription>
              Showing {paginatedKeywords.length} of {filteredCount} keywords
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={onExportCsv}>
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
              Save to Folder ({selectedKeywords.size})
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
                    checked={
                      selectedKeywords.size === paginatedKeywords.length &&
                      paginatedKeywords.length > 0
                    }
                    onCheckedChange={onToggleAll}
                  />
                </TableHead>
                <SortableHeader field="keyword" className="min-w-[150px]" {...sortProps}>
                  Keyword
                </SortableHeader>
                <SortableHeader field="position" {...sortProps}>
                  Position
                </SortableHeader>
                <SortableHeader field="volume" {...sortProps}>
                  Volume
                </SortableHeader>
                <SortableHeader field="traffic" {...sortProps}>
                  Traffic
                </SortableHeader>
                <TableHead className="min-w-[180px]">URL</TableHead>
                <SortableHeader field="kd" {...sortProps}>
                  KD%
                </SortableHeader>
                <SortableHeader field="cpc" {...sortProps}>
                  CPC
                </SortableHeader>
                <TableHead>Intent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedKeywords.map((kw) => (
                <TableRow key={kw.keyword}>
                  <TableCell>
                    <Checkbox
                      checked={selectedKeywords.has(kw.keyword)}
                      onCheckedChange={() => onToggleKeyword(kw.keyword)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{kw.keyword}</TableCell>
                  <TableCell>
                    <Badge
                      variant={kw.position <= 10 ? "default" : "secondary"}
                      className={
                        kw.position <= 3
                          ? "bg-green-600"
                          : kw.position <= 10
                            ? "bg-blue-600"
                            : ""
                      }
                    >
                      {kw.position}
                    </Badge>
                  </TableCell>
                  <TableCell>{kw.volume.toLocaleString()}</TableCell>
                  <TableCell>{kw.traffic.toLocaleString()}</TableCell>
                  <TableCell>
                    <a
                      href={kw.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                      title={kw.url}
                    >
                      {truncateUrl(kw.url)}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className={getKDColor(kw.kd)}>{kw.kd}%</span>
                  </TableCell>
                  <TableCell>${kw.cpc.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getIntentColor(kw.intent)}>{kw.intent}</Badge>
                  </TableCell>
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
