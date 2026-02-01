import { Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { KeywordFolder } from "@/lib/types";

interface FolderDetailProps {
  folder: KeywordFolder;
  onDeleteKeyword: (folderId: string, keywordName: string) => void;
}

export function FolderDetail({ folder, onDeleteKeyword }: FolderDetailProps) {
  if (folder.keywords.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="rounded-2xl bg-muted/50 p-5">
              <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="mt-4 font-medium text-muted-foreground">No keywords in this folder yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Add keywords from Keyword Finder or Keyword Overview
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>KD%</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead>Competition</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folder.keywords.map((keyword) => (
              <TableRow key={keyword.keyword}>
                <TableCell className="font-medium">{keyword.keyword}</TableCell>
                <TableCell>{keyword.volume.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={getKDColor(keyword.kd)}>{keyword.kd}%</span>
                </TableCell>
                <TableCell>${keyword.cpc.toFixed(2)}</TableCell>
                <TableCell>{keyword.competition.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={getIntentColor(keyword.intent)}>{keyword.intent}</Badge>
                </TableCell>
                <TableCell>
                  <TrendBars trend={keyword.trend} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteKeyword(folder.id, keyword.keyword)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
