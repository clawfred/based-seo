import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInt, formatCompact, formatMoney } from "./format";
import type { KeywordRow } from "./domain-types";

interface KeywordsTableProps {
  keywords: KeywordRow[];
}

/** Green for page-one, amber for page-two, muted beyond. */
function positionVariant(position?: number): "default" | "secondary" | "outline" {
  if (position === undefined) return "outline";
  if (position <= 10) return "default";
  if (position <= 20) return "secondary";
  return "outline";
}

export function KeywordsTable({ keywords }: KeywordsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Keywords</CardTitle>
        <CardDescription>
          {keywords.length > 0
            ? `Showing ${keywords.length.toLocaleString()} keywords this domain ranks for`
            : "No ranked keywords found"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keywords.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show here.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead className="hidden text-right md:table-cell">CPC</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((k, i) => (
                  <TableRow key={`${k.keyword ?? "kw"}-${i}`}>
                    <TableCell className="max-w-xs truncate font-medium">
                      {k.keyword ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {k.position !== undefined ? (
                        <Badge variant={positionVariant(k.position)}>{k.position}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatInt(k.volume)}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {k.cpc ? formatMoney(k.cpc) : "-"}
                    </TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {formatCompact(k.traffic)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
